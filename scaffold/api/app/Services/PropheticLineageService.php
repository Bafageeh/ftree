<?php

namespace App\Services;

use App\Models\Person;
use Illuminate\Support\Collection;

class PropheticLineageService
{
    public const PROPHET_SOURCE_CODE = 'CORE-001';

    /**
     * Trace a person's lineage upward and return it ordered from the Prophet
     * or the highest known ancestor down to the requested person.
     *
     * @return array{
     *     connected_to_prophet: bool,
     *     fully_confirmed: bool,
     *     pending_review_count: int,
     *     status: string,
     *     path: Collection<int, Person>,
     *     path_text: string,
     *     relation_count: int,
     *     prophet: ?Person,
     *     highest_known_ancestor: ?Person,
     *     missing_parent_for: ?Person,
     *     cycle_detected: bool
     * }
     */
    public function trace(Person $person): array
    {
        $pathFromPerson = collect();
        $current = $person;
        $visited = [];
        $cycleDetected = false;
        $brokenParentReference = false;

        while ($current) {
            if (isset($visited[$current->id])) {
                $cycleDetected = true;
                break;
            }

            $visited[$current->id] = true;
            $pathFromPerson->push($current);

            if ($current->source_code === self::PROPHET_SOURCE_CODE) {
                break;
            }

            if (! $current->lineage_parent_id) {
                break;
            }

            $parent = $current->relationLoaded('parent')
                ? $current->parent
                : $current->parent()->first();

            if (! $parent || $parent->approval_status === 'rejected') {
                $brokenParentReference = true;
                break;
            }

            $current = $parent;
        }

        /** @var Collection<int, Person> $path */
        $path = $pathFromPerson->reverse()->values();
        $prophet = $path->first(fn (Person $node) => $node->source_code === self::PROPHET_SOURCE_CODE);
        $connected = $prophet !== null && $path->first()?->id === $prophet->id;
        $highestKnownAncestor = $path->first();
        $pendingReviewCount = $path
            ->reject(fn (Person $node) => $node->approval_status === 'supervisor_confirmed')
            ->count();
        $fullyConfirmed = $connected && $pendingReviewCount === 0;

        $status = match (true) {
            $fullyConfirmed => 'connected_to_prophet_confirmed',
            $connected => 'connected_to_prophet_pending_review',
            $cycleDetected => 'cycle_detected',
            $brokenParentReference => 'broken_parent_reference',
            default => 'disconnected_from_prophet',
        };

        return [
            'connected_to_prophet' => $connected,
            'fully_confirmed' => $fullyConfirmed,
            'pending_review_count' => $pendingReviewCount,
            'status' => $status,
            'path' => $path,
            'path_text' => $path->pluck('full_name')->implode(' ← '),
            'relation_count' => max($path->count() - 1, 0),
            'prophet' => $prophet,
            'highest_known_ancestor' => $highestKnownAncestor,
            'missing_parent_for' => $connected ? null : $highestKnownAncestor,
            'cycle_detected' => $cycleDetected,
        ];
    }

    /**
     * @param Collection<int, Person> $people
     * @return Collection<int, int>
     */
    public function connectedIds(Collection $people): Collection
    {
        return $people
            ->filter(fn (Person $person) => $this->trace($person)['connected_to_prophet'])
            ->pluck('id')
            ->values();
    }

    /**
     * @param Collection<int, Person> $people
     * @return Collection<int, int>
     */
    public function disconnectedIds(Collection $people): Collection
    {
        return $people
            ->reject(fn (Person $person) => $this->trace($person)['connected_to_prophet'])
            ->pluck('id')
            ->values();
    }
}

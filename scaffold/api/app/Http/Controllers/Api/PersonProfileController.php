<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PersonResource;
use App\Models\Person;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PersonProfileController extends Controller
{
    public function update(Request $request, Person $person): PersonResource
    {
        $validated = $request->validate([
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'mobile_number' => ['nullable', 'string', 'max:32'],
            'general_details' => ['nullable', 'string', 'max:12000'],
        ]);

        $person->fill([
            'gender' => $validated['gender'] ?? null,
            'mobile_number' => filled($validated['mobile_number'] ?? null)
                ? trim($validated['mobile_number'])
                : null,
            'general_details' => filled($validated['general_details'] ?? null)
                ? trim($validated['general_details'])
                : null,
        ]);
        $person->save();
        $person->load('parent');

        return new PersonResource($person);
    }

    public function uploadPhoto(Request $request, Person $person): PersonResource
    {
        $validated = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $oldPath = $person->profile_photo_path;
        $newPath = $validated['photo']->store('people/'.$person->id, 'public');

        $person->profile_photo_path = $newPath;
        $person->save();
        $person->load('parent');

        if ($oldPath && $oldPath !== $newPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return new PersonResource($person);
    }
}

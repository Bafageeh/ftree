import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';
import type { ChartEdge, Person } from '../types';
import { LineageAwareSvgGenealogyTree } from './LineageAwareSvgGenealogyTree';
import type { TreeStatusFilter } from './ModernGenealogyTree';

type Props = {
  people: Person[];
  edges: ChartEdge[];
  branchLabels: Record<string, string>;
  statusFilter?: TreeStatusFilter;
};

type BoundaryProps = {
  children: ReactNode;
  resetKey: number;
  onReset: () => void;
};

type BoundaryState = {
  failed: boolean;
};

const MIRBAT_CODE = 'CORE-016';
const ALAWI_MIRBAT_CODE = 'MIRBAT-ALAWI-001';

export function GenealogyTree(props: Props) {
  const [resetKey, setResetKey] = useState(0);
  const verifiedPeople = useMemo(() => withVerifiedMirbatChildren(props.people), [props.people]);

  return (
    <TreeErrorBoundary resetKey={resetKey} onReset={() => setResetKey((value) => value + 1)}>
      <LineageAwareSvgGenealogyTree
        key={resetKey}
        {...props}
        people={verifiedPeople}
      />
    </TreeErrorBoundary>
  );
}

class TreeErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Genealogy tree render failed', error, info.componentStack);
  }

  componentDidUpdate(previousProps: BoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>تعذر فتح هذا الفرع كاملًا</Text>
        <Text style={styles.fallbackText}>تم منع إغلاق التطبيق. أعد عرض الشجرة من الأصل ثم افتح الأبناء تدريجيًا.</Text>
        <Pressable onPress={this.props.onReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>العودة إلى أصل الشجرة</Text>
        </Pressable>
      </View>
    );
  }
}

function withVerifiedMirbatChildren(source: Person[]): Person[] {
  const mirbat = source.find((person) => person.source_code === MIRBAT_CODE);
  if (!mirbat) return source;

  const corrected = source.map((person) => {
    if (person.source_code !== 'CORE-017') return person;

    return {
      ...person,
      full_name: 'علي بن محمد صاحب مرباط',
      honorific: 'والد الفقيه المقدم',
      lineage_parent_id: mirbat.id,
    };
  });

  if (corrected.some((person) => person.source_code === ALAWI_MIRBAT_CODE)) {
    return corrected;
  }

  const alawi: Person = {
    id: -1602,
    full_name: 'علوي بن محمد صاحب مرباط',
    source_code: ALAWI_MIRBAT_CODE,
    node_type: 'person',
    honorific: 'عم الفقيه المقدم',
    lineage_parent_id: mirbat.id,
    status: 'readable',
    approval_status: 'supervisor_confirmed',
    is_provisional: false,
    generation: (mirbat.generation || 16) + 1,
    chart_branch: 'alawi_mirbat',
    chart_color: '#F3E7A1',
    chart_order: 1702,
    summary: 'الابن الثاني لمحمد صاحب مرباط، وعم محمد الفقيه المقدم.',
    source_reference: 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة',
    source_locator: 'مركز المشجرة فوق محمد صاحب مرباط - علوي عم الفقيه المقدم',
    is_living: false,
  };

  return [...corrected, alawi];
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 24,
  },
  fallbackTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  fallbackText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: 16,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});

export type { TreeStatusFilter };

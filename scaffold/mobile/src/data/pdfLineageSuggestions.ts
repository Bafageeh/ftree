export type PdfLineageSuggestion = {
  suggestedParentName: string;
  knownLineage: string;
  confidence: number;
  evidence: string;
  reviewNote?: string;
};

// اقتراحات مقروءة يدويًا من النسخة الأصلية عالية الدقة للمشجرة.
// لا تتحول إلى نسب معتمد تلقائيًا؛ يجب أن يعتمد المشرف علاقة الأب والابن.
export const pdfLineageSuggestions: Record<string, PdfLineageSuggestion> = {
  'g-attas-abdulrahman': {
    suggestedParentName: 'عمر العطاس',
    knownLineage: 'عبد الرحمن العطاس بن عمر العطاس بن عقيل بن أحمد بن علي',
    confidence: 97,
    evidence: 'ملف المشجرة الأصلي PDF - الصفحة 1 - الفرع الأخضر الأيسر - الورقة الكبيرة لعبد الرحمن العطاس والسلسلة البيضاوية المتصلة بها.',
    reviewNote: 'اتجاه رؤوس الأسهم في هذا الموضع يبدأ من علي ثم أحمد ثم عقيل ثم عمر العطاس وينتهي بعبد الرحمن العطاس.',
  },
};

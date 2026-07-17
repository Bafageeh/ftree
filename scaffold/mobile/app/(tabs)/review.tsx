import { SafeAreaView } from 'react-native-safe-area-context';

import { SupervisorReviewBoard } from '../../src/components/SupervisorReviewBoard';
import { colors } from '../../src/theme';

export default function ReviewScreen() {
  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }} edges={['bottom']}>
      <SupervisorReviewBoard />
    </SafeAreaView>
  );
}

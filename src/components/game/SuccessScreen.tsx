import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameSession } from '@/types/game';
import { calculateGameResult } from '@/lib/gameLogic';
import { Timeline } from './Timeline';

interface SuccessScreenProps {
  session: GameSession;
  onRestart: () => void;
}

function levelChip(level: string) {
  switch (level) {
    case 'strong':
      return { text: 'قوي', variant: 'default' as const, icon: '💪' };
    case 'weak':
      return { text: 'ضعيف', variant: 'secondary' as const, icon: '⚠️' };
    case 'invalid':
      return { text: 'غير صالح', variant: 'destructive' as const, icon: '✗' };
    case 'noise':
      return { text: 'ضجيج', variant: 'destructive' as const, icon: '📢' };
    case 'none':
      return { text: 'بدون', variant: 'secondary' as const, icon: '—' };

    case 'both_correct':
      return { text: 'ممتاز', variant: 'default' as const, icon: '✅' };
    case 'one_correct':
      return { text: 'جيد', variant: 'secondary' as const, icon: '🟡' };
    case 'none_elim':
      return { text: 'بدون', variant: 'secondary' as const, icon: '—' };

    case 'clean':
      return { text: 'نضيف', variant: 'default' as const, icon: '✨' };
    case 'overweighted_e2':
      return { text: 'وزن زائد', variant: 'secondary' as const, icon: '⚖️' };
    case 'used_noise_e5':
      return { text: 'ضجيج', variant: 'destructive' as const, icon: '📢' };

    default:
      return { text: String(level), variant: 'secondary' as const, icon: '•' };
  }
}

export function SuccessScreen({ session, onRestart }: SuccessScreenProps) {
  const result = calculateGameResult(session);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-success/10 via-background to-primary/10" dir="rtl">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="text-center shadow-2xl border-2 border-success/30 overflow-hidden">
          <div className="bg-gradient-to-r from-success/20 to-accent/20 p-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-foreground">وصلت للقرار</h1>
            <p className="text-muted-foreground mt-2">الآن التقييم مبني على منهجك، مش بس الإجابة.</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline">{result.outcomeTitle}</Badge>
              <Badge variant="secondary">{result.thinkingTitle}</Badge>
              <Badge variant="outline">محاولة: {result.attemptUsed}/3</Badge>
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-foreground leading-relaxed">{result.feedbackText}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">قوة التبرير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const chip = levelChip(result.cards.evidence.level);
                      return (
                        <>
                          <span className="text-xl">{chip.icon}</span>
                          <Badge variant={chip.variant}>{chip.text}</Badge>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.cards.evidence.text}</p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">استبعاد البدائل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const map: Record<string, { icon: string; text: string; variant: any }> = {
                        both_correct: { icon: '✅', text: 'ممتاز', variant: 'default' },
                        one_correct: { icon: '🟡', text: 'جيد', variant: 'secondary' },
                        none: { icon: '—', text: 'بدون', variant: 'secondary' },
                        has_wrong: { icon: '✗', text: 'خطأ', variant: 'destructive' },
                      };
                      const chip = map[result.cards.elimination.level] || { icon: '•', text: result.cards.elimination.level, variant: 'secondary' };
                      return (
                        <>
                          <span className="text-xl">{chip.icon}</span>
                          <Badge variant={chip.variant}>{chip.text}</Badge>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.cards.elimination.text}</p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">الضجيج والوزن</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const map: Record<string, { icon: string; text: string; variant: any }> = {
                        clean: { icon: '✨', text: 'نضيف', variant: 'default' },
                        overweighted_e2: { icon: '⚖️', text: 'وزن زائد', variant: 'secondary' },
                        used_noise_e5: { icon: '📢', text: 'ضجيج', variant: 'destructive' },
                      };
                      const chip = map[result.cards.noise.level] || { icon: '•', text: result.cards.noise.level, variant: 'secondary' };
                      return (
                        <>
                          <span className="text-xl">{chip.icon}</span>
                          <Badge variant={chip.variant}>{chip.text}</Badge>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.cards.noise.text}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>📊</span>
              مسار التحقيق
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline items={result.timeline} />
          </CardContent>
        </Card>

        <Button onClick={onRestart} size="lg" className="w-full text-lg py-6 font-bold shadow-lg" variant="outline">
          العب مجدداً 🔄
        </Button>
      </div>
    </div>
  );
}

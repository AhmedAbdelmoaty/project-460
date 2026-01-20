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

export function SuccessScreen({ session, onRestart }: SuccessScreenProps) {
  const result = calculateGameResult(session);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-success/10 via-background to-primary/10" dir="rtl">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="text-center shadow-2xl border-2 border-success/30 overflow-hidden">
          <div className="bg-gradient-to-r from-success/20 to-accent/20 p-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-foreground">تمام! وصلت للقرار</h1>
            <p className="text-muted-foreground mt-2">ده ملخص نقاطك وليه اتحسبت بالشكل ده.</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="outline">{result.outcomeTitle}</Badge>
              <Badge variant="outline">محاولة: {result.attemptUsed}/3</Badge>
              <Badge variant="secondary">نقطك: {result.score}</Badge>
              {result.rank && <Badge variant="default">{result.rank}</Badge>}
            </div>

            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-foreground leading-relaxed">{result.feedbackText}</p>
            </div>

            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">تفاصيل النقاط</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.breakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">مفيش نقاط اتحسبت في المحاولة دي.</p>
                ) : (
                  <div className="space-y-2">
                    {result.breakdown.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <span className={`text-sm font-bold ${item.points >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {item.points >= 0 ? `+${item.points}` : item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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

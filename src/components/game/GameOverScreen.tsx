import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GameOverScreenProps {
  feedback: string;
  onRestart: () => void;
}

export function GameOverScreen({ feedback, onRestart }: GameOverScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-destructive/20 via-background to-muted" dir="rtl">
      <Card className="w-full max-w-lg text-center shadow-2xl border-2 border-destructive/30">
        <CardContent className="p-8 space-y-6">
          <div className="text-7xl">😔</div>

          <h1 className="text-2xl font-bold text-destructive">انتهت المحاولات</h1>

          <div className="bg-muted rounded-xl p-4">
            <p className="text-foreground leading-relaxed">{feedback}</p>
          </div>

          <p className="text-muted-foreground text-sm">
            جرّب تاني من البداية، وركز إنك تقارن أكتر من مؤشر قبل ما تحسم.
          </p>

          <Button onClick={onRestart} size="lg" className="w-full text-lg py-6 font-bold" variant="outline">
            ابدأ من جديد 🔄
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

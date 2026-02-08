import Phaser from 'phaser';

export class AnimationHelper {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  floatText(x: number, y: number, text: string, color: string = '#ffffff', duration: number = 1000): void {
    const textObj = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color,
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: textObj,
      y: y - 50,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => textObj.destroy(),
    });
  }

  damageNumber(x: number, y: number, amount: number): void {
    this.floatText(x, y, `-${amount}`, '#ff4444', 800);
  }

  healNumber(x: number, y: number, amount: number): void {
    this.floatText(x, y, `+${amount}`, '#44ff44', 800);
  }

  blockNumber(x: number, y: number, amount: number): void {
    this.floatText(x, y, `+${amount}`, '#4488ff', 800);
  }

  shake(target: Phaser.GameObjects.GameObject & { x: number; y: number }, intensity: number = 5): void {
    const origX = target.x;
    const origY = target.y;

    this.scene.tweens.add({
      targets: target,
      x: origX + intensity,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => { target.x = origX; target.y = origY; },
    });
  }

  flash(target: Phaser.GameObjects.GameObject & { setAlpha: (a: number) => void }): void {
    this.scene.tweens.add({
      targets: target,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 1,
    });
  }

  cardPlayAnim(card: Phaser.GameObjects.Container, targetX: number, targetY: number, onComplete?: () => void): void {
    this.scene.tweens.add({
      targets: card,
      x: targetX,
      y: targetY,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        card.destroy();
        if (onComplete) onComplete();
      },
    });
  }

  cardDrawAnim(card: Phaser.GameObjects.Container, fromX: number, fromY: number, toX: number, toY: number, delay: number = 0): void {
    card.x = fromX;
    card.y = fromY;
    card.setScale(0.3);
    card.setAlpha(0);

    this.scene.tweens.add({
      targets: card,
      x: toX,
      y: toY,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 300,
      delay,
      ease: 'Back.easeOut',
    });
  }

  pulse(target: Phaser.GameObjects.GameObject, scale: number = 1.1): void {
    this.scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  sparkEffect(x: number, y: number, color: number = 0xffdd44): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spark = this.scene.add.rectangle(x, y, 3, 3, color);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }
}

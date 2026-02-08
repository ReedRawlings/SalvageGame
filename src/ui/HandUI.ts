import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { CardUI, CARD_WIDTH } from './CardUI';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH } from '../utils/Constants';

export class HandUI {
  private scene: Phaser.Scene;
  private cardUIs: CardUI[] = [];
  public onCardPlay?: (card: Card) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  renderHand(cards: Card[], canPlay: (card: Card) => boolean): void {
    this.clear();

    const handY = GAME_HEIGHT - 100;
    const totalWidth = cards.length * (CARD_WIDTH + 10);
    const startX = (GAME_WIDTH - totalWidth) / 2 + CARD_WIDTH / 2;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const x = startX + i * (CARD_WIDTH + 10);
      const cardUI = new CardUI(this.scene, x, handY, card);
      cardUI.setHandPosition(x, handY);
      cardUI.setPlayable(canPlay(card));
      cardUI.onPlay = (c: Card) => {
        if (this.onCardPlay) {
          this.onCardPlay(c);
        }
      };
      this.cardUIs.push(cardUI);
    }
  }

  updatePlayability(canPlay: (card: Card) => boolean): void {
    for (const cardUI of this.cardUIs) {
      cardUI.setPlayable(canPlay(cardUI.card));
    }
  }

  removeCard(card: Card): CardUI | undefined {
    const index = this.cardUIs.findIndex(ui => ui.card === card);
    if (index >= 0) {
      const cardUI = this.cardUIs.splice(index, 1)[0];
      return cardUI;
    }
    return undefined;
  }

  clear(): void {
    for (const cardUI of this.cardUIs) {
      cardUI.destroy();
    }
    this.cardUIs = [];
  }

  getCardUIs(): CardUI[] {
    return this.cardUIs;
  }
}

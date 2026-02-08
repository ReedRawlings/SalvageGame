import { Card, CardData } from '../entities/Card';
import cardsData from '../data/cards.json';

export class DeckManager {
  public drawPile: Card[];
  public hand: Card[];
  public discardPile: Card[];
  public exhaustPile: Card[];
  private temporaryCards: Card[];

  constructor() {
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.temporaryCards = [];
  }

  buildDeck(cardIds: string[]): void {
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this.temporaryCards = [];

    for (const id of cardIds) {
      const data = (cardsData as Record<string, CardData>)[id];
      if (data) {
        this.drawPile.push(new Card(data));
      }
    }
    this.shuffle();
  }

  addCard(card: Card): void {
    this.discardPile.push(card);
  }

  addTemporaryCard(card: Card): void {
    card.isTemporary = true;
    this.temporaryCards.push(card);
    this.hand.push(card);
  }

  removeCard(card: Card): boolean {
    let index = this.drawPile.findIndex(c => c === card);
    if (index >= 0) { this.drawPile.splice(index, 1); return true; }

    index = this.discardPile.findIndex(c => c === card);
    if (index >= 0) { this.discardPile.splice(index, 1); return true; }

    index = this.hand.findIndex(c => c === card);
    if (index >= 0) { this.hand.splice(index, 1); return true; }

    return false;
  }

  shuffle(): void {
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }

  draw(count: number): Card[] {
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) {
        if (this.discardPile.length === 0) break;
        this.reshuffleDiscard();
      }
      const card = this.drawPile.pop();
      if (card) {
        this.hand.push(card);
        drawn.push(card);
      }
    }
    return drawn;
  }

  private reshuffleDiscard(): void {
    this.drawPile = [...this.discardPile];
    this.discardPile = [];
    this.shuffle();
  }

  playCard(card: Card): boolean {
    const index = this.hand.indexOf(card);
    if (index < 0) return false;
    this.hand.splice(index, 1);
    this.discardPile.push(card);
    return true;
  }

  discardCard(card: Card): boolean {
    const index = this.hand.indexOf(card);
    if (index < 0) return false;
    this.hand.splice(index, 1);
    this.discardPile.push(card);
    return true;
  }

  discardHand(): void {
    for (const card of [...this.hand]) {
      if (card.isTemporary) {
        this.hand.splice(this.hand.indexOf(card), 1);
      } else {
        this.discardCard(card);
      }
    }
  }

  exhaustCard(card: Card): boolean {
    const index = this.hand.indexOf(card);
    if (index < 0) return false;
    this.hand.splice(index, 1);
    this.exhaustPile.push(card);
    return true;
  }

  peekDrawPile(count: number): Card[] {
    return this.drawPile.slice(-count);
  }

  getAllDeckCards(): Card[] {
    return [...this.drawPile, ...this.hand, ...this.discardPile];
  }

  getDeckSize(): number {
    return this.drawPile.length + this.hand.length + this.discardPile.length;
  }

  endCombat(): void {
    this.temporaryCards = [];
    this.hand = this.hand.filter(c => !c.isTemporary);
    for (const card of this.getAllDeckCards()) {
      card.costModifier = 0;
      card.isSupercharged = false;
    }
  }

  applyCorrosion(): void {
    const allCards = this.getAllDeckCards();
    if (allCards.length === 0) return;
    const target = allCards[Math.floor(Math.random() * allCards.length)];
    target.costModifier++;
  }

  applyMagneticPull(): void {
    if (this.hand.length === 0) return;
    const target = this.hand[Math.floor(Math.random() * this.hand.length)];
    target.costModifier++;
  }

  consumeRandomDiscard(): Card | null {
    if (this.discardPile.length === 0) return null;
    const index = Math.floor(Math.random() * this.discardPile.length);
    return this.discardPile.splice(index, 1)[0];
  }

  getCardById(id: string): Card | null {
    const data = (cardsData as Record<string, CardData>)[id];
    if (!data) return null;
    return new Card(data);
  }

  getRandomDroneCard(): Card | null {
    const droneIds = Object.keys(cardsData).filter(
      id => (cardsData as Record<string, CardData>)[id].type === 'drone'
    );
    if (droneIds.length === 0) return null;
    const id = droneIds[Math.floor(Math.random() * droneIds.length)];
    return this.getCardById(id);
  }
}

import Phaser from 'phaser';

// G1 scaffold ONLY. No gameplay, saves, transport logic or platform SDK.
// Rendering must never become the authoritative source of simulation state.
class BootstrapScene extends Phaser.Scene {
  constructor() { super('BootstrapScene'); }

  create(): void {
    this.drawPreview(this.scale.width, this.scale.height);
    this.scale.on('resize', (size: Phaser.Structs.Size) => {
      this.drawPreview(size.width, size.height);
    });
  }

  private drawPreview(width: number, height: number): void {
    this.children.removeAll(true);
    const gfx = this.add.graphics();
    const cell = Math.max(27, Math.min(62, Math.floor(Math.min(width / 10, height / 10))));
    const gridSize = cell * 7;
    const left = Math.floor((width - gridSize) / 2);
    const top = Math.max(62, Math.floor((height - gridSize) / 2));

    gfx.fillStyle(0x0f2338, 1);
    gfx.fillRect(0, 0, width, height);
    gfx.fillStyle(0x182f47, 1);
    gfx.fillRoundedRect(left - 12, top - 12, gridSize + 24, gridSize + 24, 20);
    gfx.lineStyle(1, 0x496b88, 0.43);
    for (let i = 0; i <= 7; i++) {
      gfx.lineBetween(left + i * cell, top, left + i * cell, top + gridSize);
      gfx.lineBetween(left, top + i * cell, left + gridSize, top + i * cell);
    }

    // Distinct static silhouettes, intentionally not interactive mechanics.
    gfx.lineStyle(Math.max(5, cell * 0.12), 0x8da6b4, 0.76);
    gfx.lineBetween(left + cell * 1.5, top + cell * 2.5, left + cell * 5.5, top + cell * 2.5);
    gfx.lineBetween(left + cell * 3.5, top + cell * 2.5, left + cell * 3.5, top + cell * 5.5);
    this.drawModule(gfx, left + cell * 1.5, top + cell * 2.5, cell * 0.55, 0x8bd3d5);
    this.drawModule(gfx, left + cell * 5.5, top + cell * 2.5, cell * 0.6, 0xffbf7a);
    this.drawModule(gfx, left + cell * 3.5, top + cell * 5.5, cell * 0.6, 0x8bcda3);
    gfx.fillStyle(0xf3cb76, 1);
    gfx.fillRoundedRect(left + cell * 2.45, top + cell * 2.25, cell * 0.7, cell * 0.5, 5);
    gfx.fillStyle(0x142b43, 1);
    gfx.fillCircle(left + cell * 2.6, top + cell * 2.78, cell * 0.065);
    gfx.fillCircle(left + cell * 2.98, top + cell * 2.78, cell * 0.065);

    this.add.text(width / 2, 24, 'Лунная станция · концепт карты', {
      fontFamily: 'system-ui, sans-serif', fontSize: width < 520 ? '15px' : '18px',
      color: '#e6f1f6', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.add.text(width / 2, Math.min(height - 38, top + gridSize + 24), 'G1 — проектный каркас. Механики ещё не реализованы.', {
      fontFamily: 'system-ui, sans-serif', fontSize: width < 520 ? '11px' : '13px',
      color: '#b6cadd'
    }).setOrigin(0.5, 0);
  }

  private drawModule(gfx: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number): void {
    gfx.fillStyle(color, 0.18);
    gfx.fillCircle(x, y, r * 1.3);
    gfx.lineStyle(3, color, 1);
    gfx.strokeCircle(x, y, r);
    gfx.fillStyle(color, 0.85);
    gfx.fillCircle(x, y, r * 0.5);
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0f2338',
  scale: { mode: Phaser.Scale.RESIZE, width: 800, height: 600 },
  render: { antialias: true },
  scene: [BootstrapScene],
};
new Phaser.Game(config);

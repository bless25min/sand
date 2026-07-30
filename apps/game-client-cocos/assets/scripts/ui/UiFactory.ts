import {
  Color,
  Graphics,
  HorizontalTextAlignment,
  Label,
  Node,
  UITransform,
  Vec3,
  VerticalTextAlignment,
} from 'cc';

export const COLORS = {
  ink: new Color(5, 16, 17, 255),
  panel: new Color(8, 28, 29, 238),
  line: new Color(184, 139, 62, 220),
  gold: new Color(255, 199, 83, 255),
  text: new Color(240, 234, 210, 255),
  muted: new Color(143, 162, 154, 255),
  hero: new Color(88, 218, 162, 255),
  enemy: new Color(255, 101, 75, 255),
};

export function createUiNode(
  name: string,
  parent: Node,
  width: number,
  height: number,
  x = 0,
  y = 0,
): Node {
  const node = new Node(name);
  parent.addChild(node);
  node.setPosition(new Vec3(x, y));
  node.addComponent(UITransform).setContentSize(width, height);
  return node;
}

export function addPanel(node: Node, color = COLORS.panel, border = COLORS.line): Graphics {
  const transform = node.getComponent(UITransform)!;
  const { width, height } = transform.contentSize;
  const graphics = node.addComponent(Graphics);
  graphics.fillColor = color;
  graphics.roundRect(-width / 2, -height / 2, width, height, 10);
  graphics.fill();
  graphics.strokeColor = border;
  graphics.lineWidth = 2;
  graphics.roundRect(-width / 2, -height / 2, width, height, 10);
  graphics.stroke();
  return graphics;
}

export function addText(node: Node, text: string, size: number, color = COLORS.text): Label {
  const transform = node.getComponent(UITransform);
  const labelNode =
    node.getComponent(Graphics) && transform
      ? createUiNode('Text', node, transform.contentSize.width, transform.contentSize.height)
      : node;
  const label = labelNode.addComponent(Label);
  label.string = text;
  label.fontSize = size;
  label.lineHeight = Math.ceil(size * 1.15);
  label.color = color;
  label.horizontalAlign = HorizontalTextAlignment.CENTER;
  label.verticalAlign = VerticalTextAlignment.CENTER;
  label.overflow = Label.Overflow.SHRINK;
  return label;
}

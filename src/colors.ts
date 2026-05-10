type Color = {
  border: string;
  background: string;
};

const BORDER_COLORS = [
  "rgb(54, 162, 235)",
  "rgb(255, 99, 132)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(153, 102, 255)",
];

const BACKGROUND_COLORS = BORDER_COLORS.map((color) =>
  color.replace("rgb(", "rgba(").replace(")", ", 0.5)"),
);

const colors = new Map<string, Color>();
colors.set("Julius", {
  border: BORDER_COLORS[4],
  background: BACKGROUND_COLORS[4],
});
colors.set("Daan", {
  border: BORDER_COLORS[0],
  background: BACKGROUND_COLORS[0],
});
colors.set("Gerome", {
  border: BORDER_COLORS[2],
  background: BACKGROUND_COLORS[2],
});
colors.set("Jana", {
  border: BORDER_COLORS[1],
  background: BACKGROUND_COLORS[1],
});
colors.set("Martin", {
  border: BORDER_COLORS[3],
  background: BACKGROUND_COLORS[3],
});

export default colors;

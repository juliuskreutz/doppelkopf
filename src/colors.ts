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

const map = new Map<string, Color>();
map.set("Julius", {
  border: BORDER_COLORS[4],
  background: BACKGROUND_COLORS[4],
});
map.set("Daan", {
  border: BORDER_COLORS[0],
  background: BACKGROUND_COLORS[0],
});
map.set("Alex", {
  border: BORDER_COLORS[0],
  background: BACKGROUND_COLORS[0],
});
map.set("Gerome", {
  border: BORDER_COLORS[2],
  background: BACKGROUND_COLORS[2],
});
map.set("Yevgeniy", {
  border: BORDER_COLORS[2],
  background: BACKGROUND_COLORS[2],
});
map.set("Jana", {
  border: BORDER_COLORS[1],
  background: BACKGROUND_COLORS[1],
});
map.set("Althoetmar", {
  border: BORDER_COLORS[1],
  background: BACKGROUND_COLORS[1],
});
map.set("Martin", {
  border: BORDER_COLORS[3],
  background: BACKGROUND_COLORS[3],
});

function enabled() {
  "use server";

  return process.env.COLORS === "true";
}

export default { map, enabled };

// ============================================================
//  OBSERVABLE NOTEBOOK — Democracy Score Line Chart
//  Копіюй кожен блок в ОКРЕМУ КЛІТИНКУ (cell) в Observable
// ============================================================

// ═══════════════════════════════════════════
//  CELL 1: Завантаження даних
//  Тип клітинки: JavaScript
// ═══════════════════════════════════════════

vdemData = {
  // Завантажуємо CSV з GitHub Pages (або заміни на FileAttachment)
  const raw = await d3.csv(
    "https://solonynkaoleg.github.io/data-viz/data/vdem.csv",
    d => ({
      country: d.country,
      iso3: d.iso3,
      year: +d.year,
      score: +d.democracy_score
    })
  );
  return raw;
}


// ═══════════════════════════════════════════
//  CELL 2: Параметри графіка
//  Тип клітинки: JavaScript
// ═══════════════════════════════════════════

chartConfig = ({
  width: 900,
  height: 500,
  margin: { top: 30, right: 120, bottom: 50, left: 60 },

  // Країни для виділення
  highlightCountries: ["USA", "TUR", "HUN", "BRA", "IND", "POL"],

  // Кольори ліній
  lineColors: ["#1d3557", "#e63946", "#457b9d", "#2a7f62", "#e2a148", "#6c5ce7"],

  // Порогові лінії режимів
  thresholds: [
    { y: 0.70, label: "Full democracy" },
    { y: 0.50, label: "Flawed democracy" },
    { y: 0.25, label: "Hybrid regime" },
  ],

  grayBg: "#c8c8d0",
  grayThreshold: "#d1d1d6",
  grayLabel: "#8e8e93"
})


// ═══════════════════════════════════════════
//  CELL 3: Підготовка серій даних
//  Тип клітинки: JavaScript
// ═══════════════════════════════════════════

series = {
  // Групуємо по iso3
  const grouped = d3.group(vdemData, d => d.iso3);

  return Array.from(grouped, ([iso3, values]) => ({
    iso3,
    country: values[0].country,
    values: values.sort((a, b) => a.year - b.year)
  }));
}


// ═══════════════════════════════════════════
//  CELL 4: Головний графік (SVG)
//  Тип клітинки: JavaScript
// ═══════════════════════════════════════════

chart = {
  const { width, height, margin, highlightCountries, lineColors, thresholds, grayBg, grayThreshold, grayLabel } = chartConfig;
  const boundedWidth = width - margin.left - margin.right;
  const boundedHeight = height - margin.top - margin.bottom;

  const highlightSet = new Set(highlightCountries);
  const bgSeries = series.filter(s => !highlightSet.has(s.iso3));
  const hlSeries = series.filter(s => highlightSet.has(s.iso3));

  // ── Шкали (Scales) ──
  const xScale = d3.scaleLinear()
    .domain(d3.extent(vdemData, d => d.year))
    .range([0, boundedWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([boundedHeight, 0]);

  // ── Лінійний генератор ──
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.score))
    .curve(d3.curveMonotoneX);

  // ── SVG контейнер ──
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .style("font-family", "'Inter', 'Helvetica Neue', sans-serif")
    .style("background", "#fafafa");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Горизонтальна сітка ──
  g.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(yScale.ticks(5))
    .join("line")
      .attr("x1", 0)
      .attr("x2", boundedWidth)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .attr("stroke", "#e8e8ee")
      .attr("stroke-dasharray", "2,4");

  // ── Порогові лінії режимів ──
  for (const th of thresholds) {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", boundedWidth)
      .attr("y1", yScale(th.y))
      .attr("y2", yScale(th.y))
      .attr("stroke", grayThreshold)
      .attr("stroke-dasharray", "6,4")
      .attr("stroke-width", 1);

    g.append("text")
      .attr("x", boundedWidth + 6)
      .attr("y", yScale(th.y))
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .attr("fill", grayLabel)
      .text(th.label);
  }

  // ── Вісь X (роки) ──
  g.append("g")
    .attr("transform", `translate(0,${boundedHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8))
    .call(g => g.select(".domain").attr("stroke", "#ccc"))
    .call(g => g.selectAll(".tick line").attr("stroke", "#ccc"));

  // ── Вісь Y (індекс демократії) ──
  g.append("g")
    .call(d3.axisLeft(yScale).ticks(5))
    .call(g => g.select(".domain").attr("stroke", "#ccc"))
    .call(g => g.selectAll(".tick line").attr("stroke", "#ccc"));

  // ── Підписи вісей ──
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("x", boundedWidth / 2)
    .attr("y", boundedHeight + 42)
    .attr("font-size", "13px")
    .attr("fill", "#333")
    .text("Year");

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -boundedHeight / 2)
    .attr("y", -44)
    .attr("font-size", "13px")
    .attr("fill", "#333")
    .text("Liberal Democracy Index (V-Dem)");

  // ── Заголовок ──
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", 20)
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("fill", "#1d3557")
    .text("Democratic Backsliding: Selected Countries (1970–2024)");

  // ── Фонові лінії (всі країни) ──
  g.selectAll(".line-bg")
    .data(bgSeries)
    .join("path")
      .attr("class", "line-bg")
      .attr("d", s => line(s.values))
      .attr("fill", "none")
      .attr("stroke", grayBg)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.4);

  // ── Виділені лінії (обрані країни) ──
  g.selectAll(".line-hl")
    .data(hlSeries)
    .join("path")
      .attr("class", "line-hl")
      .attr("d", s => line(s.values))
      .attr("fill", "none")
      .attr("stroke", (_, i) => lineColors[i % lineColors.length])
      .attr("stroke-width", 2.5)
      .attr("opacity", 1);

  // ── Підписи країн в кінці ліній ──
  g.selectAll(".line-label")
    .data(hlSeries)
    .join("text")
      .attr("class", "line-label")
      .attr("x", d => xScale(d.values[d.values.length - 1].year) + 6)
      .attr("y", d => yScale(d.values[d.values.length - 1].score))
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("fill", (_, i) => lineColors[i % lineColors.length])
      .text(d => d.iso3);

  return svg.node();
}

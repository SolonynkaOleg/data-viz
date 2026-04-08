/* ──────────────────────────────────────────────
   WorldMap — Conflict intensity map
   Renders country boundaries from TopoJSON,
   fills countries by conflict deaths, and
   overlays proportional circles for hotspots.
   ────────────────────────────────────────────── */

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { ChartModule, ChartState, CountryYearRecord } from '../../data/types';
import { CONFLICT_GRADIENT, GRAY } from '../../config/colors';
import { getDimensions, CHART_MARGINS, TRANSITION } from '../../config/dimensions';
import { tooltip } from '../../core/tooltip';
import { aggregateConflictByCountry } from '../../data/dataTransform';
import { loadWorldTopology } from '../../data/dataLoader';

/* ── Country-name → ISO3 map (for TopoJSON matching) ── */
const NAME_TO_ISO3: Record<string, string> = {
  'Afghanistan':'AFG','Albania':'ALB','Algeria':'DZA','Angola':'AGO','Argentina':'ARG',
  'Armenia':'ARM','Australia':'AUS','Austria':'AUT','Azerbaijan':'AZE','Bangladesh':'BGD',
  'Belarus':'BLR','Belgium':'BEL','Benin':'BEN','Bhutan':'BTN','Bolivia':'BOL',
  'Bosnia and Herz.':'BIH','Botswana':'BWA','Brazil':'BRA','Brunei':'BRN','Bulgaria':'BGR',
  'Burkina Faso':'BFA','Burundi':'BDI','Cambodia':'KHM','Cameroon':'CMR','Canada':'CAN',
  'Central African Rep.':'CAF','Chad':'TCD','Chile':'CHL','China':'CHN','Colombia':'COL',
  'Congo':'COG','Costa Rica':'CRI','Croatia':'HRV','Cuba':'CUB','Cyprus':'CYP',
  'Czechia':'CZE','Côte d\'Ivoire':'CIV','Dem. Rep. Congo':'COD','Denmark':'DNK',
  'Djibouti':'DJI','Dominican Rep.':'DOM','Ecuador':'ECU','Egypt':'EGY','El Salvador':'SLV',
  'Eq. Guinea':'GNQ','Eritrea':'ERI','Estonia':'EST','eSwatini':'SWZ','Ethiopia':'ETH',
  'Fiji':'FJI','Finland':'FIN','France':'FRA','Gabon':'GAB','Gambia':'GMB','Georgia':'GEO',
  'Germany':'DEU','Ghana':'GHA','Greece':'GRC','Guatemala':'GTM','Guinea':'GIN',
  'Guinea-Bissau':'GNB','Guyana':'GUY','Haiti':'HTI','Honduras':'HND','Hungary':'HUN',
  'Iceland':'ISL','India':'IND','Indonesia':'IDN','Iran':'IRN','Iraq':'IRQ','Ireland':'IRL',
  'Israel':'ISR','Italy':'ITA','Jamaica':'JAM','Japan':'JPN','Jordan':'JOR',
  'Kazakhstan':'KAZ','Kenya':'KEN','Kosovo':'XKX','Kuwait':'KWT','Kyrgyzstan':'KGZ',
  'Laos':'LAO','Latvia':'LVA','Lebanon':'LBN','Lesotho':'LSO','Liberia':'LBR','Libya':'LBY',
  'Lithuania':'LTU','Luxembourg':'LUX','Madagascar':'MDG','Malawi':'MWI','Malaysia':'MYS',
  'Mali':'MLI','Mauritania':'MRT','Mexico':'MEX','Moldova':'MDA','Mongolia':'MNG',
  'Montenegro':'MNE','Morocco':'MAR','Mozambique':'MOZ','Myanmar':'MMR','Namibia':'NAM',
  'Nepal':'NPL','Netherlands':'NLD','New Zealand':'NZL','Nicaragua':'NIC','Niger':'NER',
  'Nigeria':'NGA','North Korea':'PRK','North Macedonia':'MKD','Norway':'NOR','Oman':'OMN',
  'Pakistan':'PAK','Palestine':'PSE','Panama':'PAN','Papua New Guinea':'PNG','Paraguay':'PRY',
  'Peru':'PER','Philippines':'PHL','Poland':'POL','Portugal':'PRT','Qatar':'QAT',
  'Romania':'ROU','Russia':'RUS','Rwanda':'RWA','Saudi Arabia':'SAU','Senegal':'SEN',
  'Serbia':'SRB','Sierra Leone':'SLE','Slovakia':'SVK','Slovenia':'SVN','Solomon Is.':'SLB',
  'Somalia':'SOM','South Africa':'ZAF','South Korea':'KOR','South Sudan':'SSD','Spain':'ESP',
  'Sri Lanka':'LKA','Sudan':'SDN','Suriname':'SUR','Sweden':'SWE','Switzerland':'CHE',
  'Syria':'SYR','Taiwan':'TWN','Tajikistan':'TJK','Tanzania':'TZA','Thailand':'THA',
  'Timor-Leste':'TLS','Togo':'TGO','Trinidad and Tobago':'TTO','Tunisia':'TUN',
  'Turkey':'TUR','Turkmenistan':'TKM','Uganda':'UGA','Ukraine':'UKR',
  'United Arab Emirates':'ARE','United Kingdom':'GBR','United States of America':'USA',
  'Uruguay':'URY','Uzbekistan':'UZB','Vanuatu':'VUT','Venezuela':'VEN','Vietnam':'VNM',
  'W. Sahara':'ESH','Yemen':'YEM','Zambia':'ZMB','Zimbabwe':'ZWE',
};

export class WorldMap implements ChartModule {
  private container!: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private projection!: d3.GeoProjection;
  private pathGen!: d3.GeoPath;
  private colorScale!: d3.ScaleSequential<string>;
  private topoData: any = null;
  private geoFeatures: any[] = [];
  private landFeature: any = null;
  private built = false;
  private topoLoaded = false;

  init(container: HTMLElement): void {
    this.container = container;
    tooltip.init();

    this.colorScale = d3.scaleSequential(d3.interpolateOrRd).domain([0, 10000]);

    // Start loading topo in background
    loadWorldTopology().then(topo => {
      if (topo) {
        this.topoData = topo;
        this.geoFeatures = (topojson.feature(topo, topo.objects.countries) as any).features;
        this.landFeature = topojson.feature(topo, topo.objects.land);
        // Attach iso3 to each feature
        for (const f of this.geoFeatures) {
          f.properties.iso3 = NAME_TO_ISO3[f.properties.name] ?? '';
        }
        this.topoLoaded = true;
      }
    });
  }

  private buildSvg(dim: ReturnType<typeof getDimensions>): void {
    if (this.svg) this.svg.remove();

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('class', 'chart-svg world-map');

    this.g = this.svg.append('g')
      .attr('transform', `translate(${dim.margin.left},${dim.margin.top})`);

    this.projection = d3.geoNaturalEarth1()
      .fitSize([dim.boundedWidth, dim.boundedHeight], { type: 'Sphere' } as any);

    this.pathGen = d3.geoPath(this.projection);

    // Ocean background
    this.g.append('path')
      .datum({ type: 'Sphere' } as any)
      .attr('d', this.pathGen)
      .attr('fill', '#f0f4f8')
      .attr('stroke', GRAY[300])
      .attr('stroke-width', 0.8);

    // Graticule
    this.g.append('path')
      .datum(d3.geoGraticule10())
      .attr('d', this.pathGen)
      .attr('fill', 'none')
      .attr('stroke', GRAY[200])
      .attr('stroke-width', 0.3);

    this.built = true;
  }

  update(state: ChartState, data: CountryYearRecord[]): void {
    const dim = getDimensions(this.container, CHART_MARGINS.map);
    if (dim.boundedWidth <= 0 || dim.boundedHeight <= 0) return;

    if (!this.built) this.buildSvg(dim);

    const [startYear, endYear] = state.yearRange ?? [1990, 2024];

    // Aggregate conflict by country
    const conflictAgg = aggregateConflictByCountry(data, startYear, endYear);
    const maxDeaths = Math.max(1, ...Array.from(conflictAgg.values()).map(v => v.deaths));
    this.colorScale.domain([0, maxDeaths * 0.6]);

    if (this.topoLoaded) {
      this.renderCountries(conflictAgg, startYear, endYear);
    }

    this.renderConflictDots(data, conflictAgg, startYear, endYear, maxDeaths);
    this.renderLegend(dim, maxDeaths);
    this.renderTimeLabel(startYear, endYear, dim);
  }

  private renderCountries(
    conflictAgg: Map<string, { deaths: number; events: number; country: string }>,
    startYear: number,
    endYear: number,
  ): void {
    const countries = this.g.selectAll<SVGPathElement, any>('.country-path')
      .data(this.geoFeatures, (d: any) => d.properties.name);

    countries.exit().remove();

    countries.enter()
      .append('path')
      .attr('class', 'country-path')
      .merge(countries)
      .attr('d', this.pathGen as any)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.4)
      .attr('fill', (d: any) => {
        const iso3 = d.properties.iso3;
        const agg = conflictAgg.get(iso3);
        if (agg && agg.deaths > 0) {
          return this.colorScale(agg.deaths);
        }
        return '#e8ecf0';
      })
      .on('mouseover', (event: MouseEvent, d: any) => {
        const iso3 = d.properties.iso3;
        const agg = conflictAgg.get(iso3);
        if (agg && agg.deaths > 0) {
          tooltip.show(
            `<strong>${agg.country}</strong><br/>` +
            `<div class="tt-row"><span class="tt-label">Deaths:</span> <span class="tt-value">${d3.format(',')(agg.deaths)}</span></div>` +
            `<div class="tt-row"><span class="tt-label">Events:</span> <span class="tt-value">${d3.format(',')(agg.events)}</span></div>` +
            `<div class="tt-row"><span class="tt-label">Period:</span> <span class="tt-value">${startYear}–${endYear}</span></div>`,
            event,
          );
        } else {
          tooltip.show(`<strong>${d.properties.name}</strong><br/><span style="color:#999">No recorded conflict</span>`, event);
        }
      })
      .on('mousemove', (event: MouseEvent) => tooltip.move(event))
      .on('mouseout', () => tooltip.hide());
  }

  private renderConflictDots(
    data: CountryYearRecord[],
    conflictAgg: Map<string, { deaths: number; events: number; country: string }>,
    startYear: number,
    endYear: number,
    maxDeaths: number,
  ): void {
    // Get unique country centroids
    const centroids = new Map<string, { country: string; iso3: string; lat: number; lng: number }>();
    for (const r of data) {
      if (!centroids.has(r.iso3)) {
        centroids.set(r.iso3, { country: r.country, iso3: r.iso3, lat: r.latitude, lng: r.longitude });
      }
    }

    interface DotDatum {
      iso3: string;
      country: string;
      deaths: number;
      events: number;
      cx: number;
      cy: number;
    }

    const rScale = d3.scaleSqrt().domain([0, maxDeaths]).range([0, 30]);
    const dotData: DotDatum[] = [];

    for (const [iso3, agg] of conflictAgg) {
      if (agg.deaths < 100) continue;  // only show circles for significant conflicts
      const c = centroids.get(iso3);
      if (!c) continue;
      const projected = this.projection([c.lng, c.lat]);
      if (!projected) continue;
      dotData.push({
        iso3,
        country: agg.country,
        deaths: agg.deaths,
        events: agg.events,
        cx: projected[0],
        cy: projected[1],
      });
    }

    const dots = this.g.selectAll<SVGCircleElement, DotDatum>('.conflict-circle')
      .data(dotData, d => d.iso3);

    dots.exit()
      .transition().duration(TRANSITION.normal)
      .attr('r', 0)
      .remove();

    dots.enter()
      .append('circle')
      .attr('class', 'conflict-circle')
      .attr('cx', d => d.cx)
      .attr('cy', d => d.cy)
      .attr('r', 0)
      .on('mouseover', (event, d) => {
        tooltip.show(
          `<strong>${d.country}</strong><br/>` +
          `<div class="tt-row"><span class="tt-label">Deaths:</span> <span class="tt-value">${d3.format(',')(d.deaths)}</span></div>` +
          `<div class="tt-row"><span class="tt-label">Events:</span> <span class="tt-value">${d3.format(',')(d.events)}</span></div>` +
          `<div class="tt-row"><span class="tt-label">Period:</span> <span class="tt-value">${startYear}–${endYear}</span></div>`,
          event,
        );
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseout', () => tooltip.hide())
      .merge(dots)
      .transition().duration(TRANSITION.slow)
      .attr('cx', d => d.cx)
      .attr('cy', d => d.cy)
      .attr('r', d => rScale(d.deaths))
      .attr('fill', '#e63946')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#c0392b')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6);
  }

  private renderLegend(dim: ReturnType<typeof getDimensions>, maxDeaths: number): void {
    this.g.selectAll('.map-legend').remove();

    const legend = this.g.append('g')
      .attr('class', 'map-legend')
      .attr('transform', `translate(10, ${dim.boundedHeight - 90})`);

    // Choropleth gradient bar
    legend.append('text')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', GRAY[600])
      .text('Conflict deaths (cumulative)');

    const barW = 140;
    const barH = 10;
    const defs = this.svg.append('defs');
    const gradId = 'conflict-gradient-legend';
    defs.select(`#${gradId}`).remove();
    const grad = defs.append('linearGradient').attr('id', gradId);
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      grad.append('stop')
        .attr('offset', `${(i / steps) * 100}%`)
        .attr('stop-color', d3.interpolateOrRd(i / steps));
    }

    legend.append('rect')
      .attr('y', 8)
      .attr('width', barW)
      .attr('height', barH)
      .attr('rx', 2)
      .attr('fill', `url(#${gradId})`);

    legend.append('text')
      .attr('x', 0).attr('y', 30)
      .attr('font-size', '9px').attr('fill', GRAY[500])
      .text('0');

    legend.append('text')
      .attr('x', barW).attr('y', 30)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px').attr('fill', GRAY[500])
      .text(d3.format('.2s')(maxDeaths));

    // Circle size legend
    legend.append('text')
      .attr('y', 50)
      .attr('font-size', '10px').attr('fill', GRAY[500])
      .text('Circle = proportional to deaths');
  }

  private renderTimeLabel(startYear: number, endYear: number, dim: ReturnType<typeof getDimensions>): void {
    this.g.selectAll('.map-time-label').remove();

    this.g.append('text')
      .attr('class', 'map-time-label')
      .attr('x', dim.boundedWidth - 10)
      .attr('y', 20)
      .attr('text-anchor', 'end')
      .attr('font-family', 'var(--font-serif)')
      .attr('font-size', '1.2rem')
      .attr('font-weight', '600')
      .attr('fill', GRAY[400])
      .text(`${startYear} – ${endYear}`);
  }

  resize(): void {
    if (!this.container) return;
    this.built = false;
    if (this.svg) this.svg.remove();
  }

  destroy(): void {
    this.svg?.remove();
    tooltip.hide();
  }
}

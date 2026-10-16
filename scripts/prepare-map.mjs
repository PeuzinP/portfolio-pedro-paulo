import fs from 'node:fs'
const source = JSON.parse(fs.readFileSync(process.env.TEMP + '/portfolio-countries.geojson', 'utf8'))
for (const f of source.features) { if (f.properties['ISO3166-1-Alpha-2'] === 'CN-TW') f.properties['ISO3166-1-Alpha-2'] = 'TW'; if (f.properties.name === 'Kosovo') f.properties['ISO3166-1-Alpha-2'] = 'XK' }
const features = source.features.filter(f => /^[A-Z]{2}$/.test(f.properties['ISO3166-1-Alpha-2'])).map(f => {
 const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
 const points = []; const paths = []
 for (const polygon of polygons) for (const ring of polygon) {
  const kept = ring.filter((p,i) => ring.length <= 12 || i === 0 || i === ring.length-1 || Math.hypot(p[0]-ring[i-1][0],p[1]-ring[i-1][1]) > .12 || i % 12 === 0)
  if (kept.length < 4) continue
  const projected = kept.map(([lon,lat]) => [+(lon+180).toFixed(2), +(90-lat).toFixed(2)])
  points.push(...projected); paths.push('M'+projected.map(p=>p.join(',')).join('L')+'Z')
 }
 if (!points.length) return null
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return {code:f.properties['ISO3166-1-Alpha-2'],name:f.properties.name,path:paths.join(''),bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}
}).filter(Boolean)
fs.writeFileSync('public/geo/countries.json',JSON.stringify(features))

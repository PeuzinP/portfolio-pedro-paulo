import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const geometry = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'portfolio-brazil-states.geojson'), 'utf8'))
const names = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'portfolio-brazil-state-names.json'), 'utf8'))
const states = geometry.features.map(feature => {
  const state = names.find(item => String(item.id) === feature.properties.codarea)
  if (!state) throw new Error(`Unknown IBGE state ${feature.properties.codarea}`)
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
  const points = []
  const parts = polygons.flatMap(polygon => polygon.map(ring => {
    const projected = ring.map(([lon, lat]) => [+(lon + 180).toFixed(3), +(90 - lat).toFixed(3)])
    points.push(...projected)
    return 'M' + projected.map(point => point.join(',')).join('L') + 'Z'
  }))
  const xs = points.map(point => point[0]), ys = points.map(point => point[1])
  return {code:state.sigla,name:state.nome,path:parts.join(''),bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]}
}).sort((a,b) => a.name.localeCompare(b.name,'pt-BR'))
if (states.length !== 27) throw new Error('Expected 27 federative units')
fs.writeFileSync('public/geo/brazil-states.json', JSON.stringify(states))
fs.writeFileSync('shared/brazil-states.ts', '// Names and codes: IBGE Localidades API. Includes the Federal District.\nexport const BRAZIL_STATES: Record<string, string> = ' + JSON.stringify(Object.fromEntries(states.map(state => [state.code,state.name])),null,2) + '\n')
console.log(`Prepared ${states.length} federative units (${fs.statSync('public/geo/brazil-states.json').size} bytes)`)

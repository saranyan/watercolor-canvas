const Sketch = require('sketch-js')
const newArray = require('new-array')
const vec2 = require('gl-vec2')
const { GUI } = require('dat-gui')
const Alea = require('alea')
const normal = require('./normal')

const container = document.body.appendChild(document.createElement('div'))
document.body.style.margin = 0

const ctx = Sketch.create({
  container: container,
  autostart: false,
  autoclear: false
})

const settings = {
  margin: 100,
  shapeCount: 4,
  shapePoints: 8,
  canvasSize: 450,
  shapeSize: 300,
  deformations: 2,
  layers: 70,
  seed: 16,
  fitToNeighbor: 'max',
  sigma: 1.5,
  blend: 'lighten'
}

// const colors = [
//   // [46, 64, 69],
//   // [131, 173, 181],
//   // [199, 187, 201],
//   // [94, 60, 88],
//   // [191, 181, 178]
//   [200, 14, 25]
// ]

let shapes
let rand

ctx.setup = ctx.resize = function () {
  ctx.globalCompositeOperation = settings.blend
  rand = new Alea(settings.seed)
  ctx.clearRect(0, 0, ctx.width, ctx.height)

  const canvasCenter = [ctx.width / 2, ctx.height / 2]
  shapes = newArray(settings.shapeCount).map(() => {
    // const rgb = colors[colors.length * rand() | 0]
    const rgb = [
      rand() * 256 | 0,
      rand() * 256 | 0,
      rand() * 256 | 0
    ]

    const rads = rand() * Math.PI * 2
    const dist = Math.pow(rand(), 0.5) * settings.canvasSize
    const shapeCenter = [
      Math.cos(rads) * dist + canvasCenter[0],
      Math.sin(rads) * dist + canvasCenter[1]
    ]
    let points = newArray(settings.shapePoints).map((_, i) => {
      const rads = Math.PI * 2 / settings.shapePoints * i
      return [
        Math.cos(rads) * settings.shapeSize + shapeCenter[0],
        Math.sin(rads) * settings.shapeSize + shapeCenter[1]
      ]
    })

    let j = settings.deformations
    while (j--) {
      points = deformPolygon(points)
    }

    return { points, rgb }
  })

  let q = shapes.length * settings.layers
  while (q--) {
    const { points, rgb } = shapes[q % shapes.length]
    let detailedDeform = points.slice()
    let k = settings.deformations
    while (k--) {
      detailedDeform = deformPolygon(detailedDeform)
    }
    const opacity = 1 / (settings.layers + 4)
    const color = `rgba(${rgb.join(', ')}, ${opacity})`
    drawPolygon(ctx, detailedDeform, color)
  }
}

const gui = new GUI()
gui.add(settings, 'shapeCount', 1, 10).step(1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'shapePoints', 3, 15).step(1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'canvasSize', 1, 1000).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'shapeSize', 1, 1000).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'deformations', 0, 6).step(1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'layers', 1, 200).step(1).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'sigma', 0, 6).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'blend', ['lighten', 'darken']).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'fitToNeighbor', ['min', 'max']).onChange(ctx.setup.bind(ctx))
gui.add(settings, 'seed', 0, 999).onChange(ctx.setup.bind(ctx))

// need to figure this out
function deformPolygon (points) {
  let newPoints = []
  for (let i = 0; i < points.length; i++) {
    newPoints.push(points[i])
    const nextPoint = points[i + 1] || points[0]
    newPoints.push(vec2.lerp([], points[i], nextPoint, rand()))
  }
  newPoints = newPoints.map((pt, i) => {
    const lastPt = newPoints[i - 1] || newPoints[newPoints.length - 1]
    const nextPt = newPoints[i + 1] || newPoints[0]
    const minOrMax = Math[settings.fitToNeighbor]
    const distToClosestPt = minOrMax(
      vec2.distance(pt, lastPt),
      vec2.distance(pt, nextPt)
    )
    const r = normal(0, distToClosestPt / settings.sigma, rand)
    return [
      r() + pt[0],
      r() + pt[1]
    ]
  })
  return newPoints
}

function drawPolygon (ctx, points, color) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  points.slice(1).forEach(pt => ctx.lineTo(pt[0], pt[1]))
  ctx.lineTo(points[0][0], points[0][1])
  ctx.fillStyle = color
  ctx.fill()
}

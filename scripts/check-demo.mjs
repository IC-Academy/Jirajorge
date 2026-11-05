import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const html = fs.readFileSync('demo/index.html','utf8')
const match = html.match(/<script>([\s\S]*?)<\/script>/)
assert.ok(match,'La demo debe incluir script local')
new vm.Script(match[1],{filename:'demo/index.html'})
for (const token of ['Dashboard','Cartera de proyectos','Centro de autorizaciones','Nueva solicitud','data-user','localStorage','MODO DEMO']) {
  assert.ok(html.includes(token),'Falta componente de demo: '+token)
}
assert.ok(html.includes('Armando Acosta') && html.includes('Gabriel Sabogal'),'Faltan perfiles ejecutivos')
assert.ok(!/<script\s+src=/i.test(html),'La demo debe operar sin scripts remotos')
assert.ok(!/fetch\(/.test(match[1]),'La demo no debe hacer llamadas remotas')
console.log('Demo HTML: script válido, vistas esenciales y modo offline confirmados')

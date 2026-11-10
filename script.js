// =====================================================================
// 1. FUNÇÕES AUXILIARES
//    $(id)  -> pega um elemento da página pelo id
//    v(id)  -> lê o valor numérico de um campo (0 se estiver vazio)
//    fmt()  -> formata número no padrão brasileiro (vírgula decimal)
// =====================================================================
const $ = id => document.getElementById(id), v = id => parseFloat($(id).value) || 0;
const fmt = (x, g = 3) => x === Infinity ? '∞' : Number.isFinite(x) ? x.toLocaleString('pt-BR', { maximumFractionDigits: g }) : '—';
// Banco de materiais: [E (GPa), fy escoamento (MPa), τ ruptura ao cisalhamento (MPa), ρ densidade (kg/m³)]
// 'Personalizado' = o usuário digita os valores manualmente
const MATS = { "Aço carbono": [200, 350, 210, 7850], "Aço estrutural": [200, 250, 150, 7850], "Aço inoxidável": [193, 215, 130, 8000], "Alumínio": [69, 240, 145, 2700], "Titânio": [114, 880, 530, 4430], "Personalizado": null };
// Elementos da estrutura: [código interno, nome mostrado na tela]
const EL = [["beam", "Viga AC"], ["bd", "Barra BD"], ["ce", "Barra CE"], ["pB", "Pinos em B"], ["pC", "Pinos em C"]];
// ---------------------------------------------------------------------
// 2. MONTAGEM DO MENU LATERAL (geradores de HTML dos campos)
// ---------------------------------------------------------------------
const fld = (id, l, val = '', x = '') => `<label>${l}<input id="${id}" type="number" step="any" value="${val}" ${x}></label>`;
const sel = (attr, val, o) => `<select ${attr}>${o.map(([a, b]) => `<option value="${a}" ${a == val ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
const unitSel = (id, unit='mm', area=false) => sel(`id="${id}"`, unit, area ? [['m2','m²'],['cm2','cm²'],['mm2','mm²']] : [['m','m'],['cm','cm'],['mm','mm']]);
const lengthField = (id, label, value, unitId=id+'_u', unit='m') => `<div>${fld(id,label,value)}<label>Unidade ${unitSel(unitId,unit)}</label></div>`;
// Bloco de material: propriedades editáveis e identificação para materiais personalizados.
const matBlock = k => `<label>Material<select id="m_${k}">${Object.keys(MATS).map(n => `<option>${n}</option>`).join('')}</select></label><div id="custom_${k}" style="display:none">${`<label>Nome ou código do material<input id="mn_${k}" type="text" placeholder="Ex.: ASTM A36"></label>`}</div><div class="g4">${fld('E_' + k, 'E (GPa)')}${fld('fy_' + k, 'fy (MPa)')}${fld('t_' + k, 'τ ruptura (MPa)')}${fld('r_' + k, 'ρ densidade (kg/m³)')}</div>`;
// Bloco de seção: permite informar dimensões ou área com geometria definida.
const secBlock = (k, b, h) => `<label>Seção transversal<select id="s_${k}"><option value="r">Retangular</option><option value="c">Circular maciça</option></select></label>
<label>Forma de informar<select id="mode_${k}"><option value="dims">Informar dimensões</option><option value="area">Informar área diretamente</option></select></label>
<div id="dims_${k}"><div class="g2" id="rect_${k}">${lengthField('b_'+k,'Largura b',b,'u_b_'+k,'mm')}${lengthField('h_'+k,'Altura h',h,'u_h_'+k,'mm')}</div><div id="circ_${k}" style="display:none">${lengthField('dd_'+k,'Diâmetro d',20,'u_dd_'+k,'mm')}</div></div>
<div id="area_${k}" style="display:none"><div class="g2">${fld('area_' + k,'Área A',2000)}<label>Unidade ${unitSel('u_area_'+k,'mm2',true)}</label></div><div id="areaRect_${k}">${lengthField('areaB_'+k,'Largura b conhecida',b,'u_areaB_'+k,'mm')}<div class="small">A altura será calculada automaticamente a partir da área e da largura informadas.</div></div><div id="areaCirc_${k}" class="small">O diâmetro será calculado automaticamente a partir da área circular.</div></div>
<div class="sec"><div id="fig_${k}"></div><div id="pr_${k}" class="small"></div></div>`;
// Bloco dos pinos: diâmetro e espessuras das peças para verificação de esmagamento.
const pinBlock = s => `<h3>Ligação ${s}</h3><div class="g2">${lengthField('d_' + s, 'Diâmetro d', 20, 'u_d_'+s, 'mm')}${fld('n_' + s, 'Nº de pinos', 2, 'min="1" step="1"')}</div>
<label>Tipo de cisalhamento<select id="sh_${s}"><option value="single">Simples (1 plano)</option><option value="double">Duplo (2 planos)</option></select></label><h3>Espessuras para esmagamento</h3><div class="g2">${lengthField('tb_'+s,'Espessura da viga AC',10,'u_tb_'+s,'mm')}${lengthField('tm_'+s,`Espessura da barra ${s=='B'?'BD':'CE'}`,10,'u_tm_'+s,'mm')}</div><div class="small">Os valores iniciais de espessura são exemplos. Informe as espessuras reais das peças conectadas.</div>${matBlock('p' + s)}`;
// Escreve na página todas as seções do menu lateral (geometria, seções, pinos e cargas)
$('side').innerHTML = `
<details><summary>1. Geometria e apoios</summary><div class="g2">${lengthField('L','Comprimento AC',3,'u_L','m')}${lengthField('B','Posição B',1,'u_B','m')}${lengthField('C','Posição C',3,'u_C','m')}${lengthField('LA','Comprimento BD',1.5,'u_LA','m')}${lengthField('LB','Comprimento CE',1,'u_LB','m')}</div></details>
<details><summary>2. Viga AC — seção e material</summary>${secBlock('beam', 100, 200)}${matBlock('beam')}</details>
<details><summary>3. Barra BD — seção e material</summary>${secBlock('bd', 20, 20)}${matBlock('bd')}</details>
<details><summary>4. Barra CE — seção e material</summary>${secBlock('ce', 20, 20)}${matBlock('ce')}</details>
<details><summary>5. Pinos e rebites</summary>${pinBlock('B')}${pinBlock('C')}</details>
<details><summary>6. Forças</summary><div id="loads"></div><div class="g2" style="margin-top:8px"><button onclick="addLoad('F')">+ Força</button><button onclick="addLoad('Q')">+ Carga distribuída</button><button onclick="addLoad('M')">+ Momento</button></div>
<div class="small" style="margin-top:6px">Ângulo: 0° = →, 90° = ↑, 270° = ↓ (anti-horário). Distribuída: uniforme (q inicial = final), triangular (uma ponta 0) ou trapezoidal.</div></details>
<div class="g2"><button onclick="restore()">Caso-teste oficial</button><button onclick="restore()">Restaurar padrão</button></div><div id="msg" class="small" style="margin-top:8px"></div>`;
// Permite abrir uma seção por vez; todas começam recolhidas ao iniciar.
$('side').querySelectorAll('details').forEach(detail => {
    detail.addEventListener('toggle', () => {
        if (detail.open) {
            $('side').querySelectorAll('details').forEach(other => {
                if (other !== detail) other.open = false;
            });
        }
    });
});
// ---------------------------------------------------------------------
// 3. ESTADO DO PROGRAMA E CARREGAMENTOS
//    loads = lista de cargas (F = força, Q = distribuída, M = momento)
//    D     = resultados do último cálculo
//    drag  = ponto que está sendo arrastado com o mouse
//    anim  = controle da animação (t vai de 0 a 1)
// ---------------------------------------------------------------------
let loads = [], nid = 1, D = null, drag = null, anim = { t: 1 };
// Conversões de unidades: comprimentos internos em mm e geometria estrutural em m.
const lengthToMM = (value, unit) => value * ({m:1000, cm:10, mm:1}[unit] || 1);
const lengthToM = id => lengthToMM(v(id), $('u_' + id)?.value || 'm') / 1000;
const areaToMM2 = (value, unit) => value * ({m2:1e6, cm2:100, mm2:1}[unit] || 1);
const fieldMM = id => lengthToMM(v(id), $('u_' + id)?.value || 'mm');
// Atualiza o campo de nome e preenche propriedades de materiais conhecidos.
function setMat(k, n) { const m = MATS[n]; $('custom_' + k).style.display = n == 'Personalizado' ? '' : 'none'; if (!m) return; ['E', 'fy', 't', 'r'].forEach((p, i) => $(p + '_' + k).value = m[i]); }
// Volta para o caso-teste oficial (valores padrão) e recalcula
function restore() {
    const dv = { L: 3, B: 1, C: 3, LA: 1.5, LB: 1, b_beam: 100, h_beam: 200, b_bd: 20, h_bd: 20, b_ce: 20, h_ce: 20, d_B: 20, d_C: 20, n_B: 2, n_C: 2, tb_B:10, tm_B:10, tb_C:10, tm_C:10 };
    Object.entries(dv).forEach(([k, x]) => { if ($(k)) $(k).value = x; });
    ['L','B','C','LA','LB'].forEach(k => $('u_'+k).value = 'm');
    ['beam', 'bd', 'ce'].forEach(k => { $('s_' + k).value = 'r'; $('mode_'+k).value='dims'; $('dd_' + k).value = 20; $('u_b_'+k).value='mm'; $('u_h_'+k).value='mm'; $('u_dd_'+k).value='mm'; $('u_area_'+k).value='mm2'; $('u_areaB_'+k).value='mm'; });
    ['B','C'].forEach(k => { ['d_','tb_','tm_'].forEach(prefix => $('u_'+prefix+k).value='mm'); });
    ['B', 'C'].forEach(s => $('sh_' + s).value = 'single');
    EL.forEach(([k]) => { $('m_' + k).value = 'Aço estrutural'; setMat(k, 'Aço estrutural'); });
    $('lam').value = 100;
    loads = [{ id: 1, t: 'F', P: 20, u: 'kN', ang: 270, x: 0 }];
    nid = 2;
    renderLoads();
    calc();
}
// Adiciona uma nova carga (F, Q ou M) com valores iniciais
function addLoad(t) {
    const L = lengthToM('L'), b = { id: nid++, t };
    if (t == 'F')
        Object.assign(b, { P: 10, u: 'kN', ang: 270, x: +(L / 2).toFixed(2) });
    if (t == 'Q')
        Object.assign(b, { x: 0, x2: L, w1: 5, w2: 5, u: 'kN/m', dir: 'down' });
    if (t == 'M')
        Object.assign(b, { M0: 10, u: 'kN·m', x: +(L / 2).toFixed(2), sense: 'ccw' });
    loads.push(b);
    renderLoads();
    calc();
}
// Remove uma carga pelo id
function delLoad(id) { loads = loads.filter(l => l.id != id); renderLoads(); calc(); }
// Guarda no objeto da carga o que o usuário digitou (e troca o tipo se for o caso)
function setL(id, k, val) {
    const l = loads.find(a => a.id == id);
    l[k] = ['t', 'u', 'dir', 'sense'].includes(k) ? val : (parseFloat(val) || 0);
    if (k == 't') {
        const keep = { id: l.id, t: val };
        const L = lengthToM('L');
        Object.keys(l).forEach(x => delete l[x]);
        Object.assign(l, keep);
        if (val == 'F')
            Object.assign(l, { P: 10, u: 'kN', ang: 270, x: 0 });
        if (val == 'Q')
            Object.assign(l, { x: 0, x2: L, w1: 5, w2: 5, u: 'kN/m', dir: 'down' });
        if (val == 'M')
            Object.assign(l, { M0: 10, u: 'kN·m', x: 0, sense: 'ccw' });
        renderLoads();
    }
}
// Desenha na tela os campos de cada carga, conforme o tipo
function renderLoads() {
    $('loads').innerHTML = loads.map((l, i) => {
        const n = (k, lab) => `<label>${lab}<input id="ld_${l.id}_${k}" type="number" step="any" value="${l[k]}" oninput="setL(${l.id},'${k}',this.value)"></label>`;
        const s = (k, o) => sel(`id="ld_${l.id}_${k}" onchange="setL(${l.id},'${k}',this.value);calc()"`, l[k], o);
        let b = '';
        if (l.t == 'F')
            b = `<div class="g2">${n('P', 'Intensidade P')}<label>Unidade${s('u', [['kN', 'kN'], ['N', 'N']])}</label>${n('ang', 'Ângulo (°)')}${n('x', 'Posição x (m)')}</div><div class="small" id="cmp_${l.id}"></div>`;
        if (l.t == 'Q')
            b = `<div class="g2">${n('x', 'x inicial (m)')}${n('x2', 'x final (m)')}${n('w1', 'Intensidade inicial')}${n('w2', 'Intensidade final')}<label>Unidade${s('u', [['kN/m', 'kN/m'], ['N/m', 'N/m']])}</label><label>Sentido${s('dir', [['down', 'Para baixo'], ['up', 'Para cima']])}</label></div>`;
        if (l.t == 'M')
            b = `<div class="g2">${n('M0', 'Momento')}<label>Unidade${s('u', [['kN·m', 'kN·m'], ['N·m', 'N·m']])}</label>${n('x', 'Posição x (m)')}<label>Sentido${s('sense', [['ccw', 'Anti-horário ↺'], ['cw', 'Horário ↻']])}</label></div>`;
        return `<div class="ld"><div class="h"><span>#${i + 1} ${sel(`onchange="setL(${l.id},'t',this.value);calc()"`, l.t, [['F', 'Força concentrada'], ['Q', 'Distribuída / triangular / trapezoidal'], ['M', 'Momento concentrado']])}</span>${loads.length > 1 ? `<button class="del" onclick="delLoad(${l.id})">Remover</button>` : ''}</div>${b}</div>`;
    }).join('');
}
// ---------------------------------------------------------------------
// 4. PROPRIEDADES DAS SEÇÕES E MATERIAIS
//    Retângulo: A = b·h        I = b·h³/12      c = h/2
//    Círculo:   A = π·d²/4     I = π·d⁴/64      c = d/2
//    W = I/c (módulo resistente)   r = √(I/A) (raio de giração)
// ---------------------------------------------------------------------
const sec = k => {
    const t = $('s_' + k).value, mode = $('mode_' + k).value;
    let A, I, c, b = 0, h = 0, d = 0;
    if (mode == 'area') {
        A = areaToMM2(v('area_' + k), $('u_area_' + k).value);
        if (t == 'r') {
            b = fieldMM('areaB_' + k);
            h = b > 0 ? A / b : 0;
        } else {
            d = A > 0 ? Math.sqrt(4 * A / Math.PI) : 0;
        }
    } else if (t == 'r') {
        b = fieldMM('b_' + k); h = fieldMM('h_' + k); A = b * h;
    } else {
        d = fieldMM('dd_' + k); A = Math.PI * d * d / 4;
    }
    if (t == 'r') { I = b * h ** 3 / 12; c = h / 2; }
    else { I = Math.PI * d ** 4 / 64; c = d / 2; }
    return { t, mode, A, I, c, W: I / c, r: Math.sqrt(I / A), b, h, d };
}
// Lê as propriedades do material de um elemento
const mat = k => ({ E: v('E_' + k), fy: v('fy_' + k), tau: v('t_' + k), rho: v('r_' + k) });
const matName = k => $('m_' + k).value == 'Personalizado' ? ($('mn_' + k).value.trim() || 'Personalizado') : $('m_' + k).value;
// Figura da seção transversal (SVG) mostrada ao lado dos campos
function fig(p) {
    if (p.t == 'c')
        return `<svg viewBox="0 0 110 90" width="110"><circle cx="50" cy="40" r="32" fill="#dbeafe" stroke="#155eef" stroke-width="2"/><line x1="18" y1="40" x2="82" y2="40" stroke="#d92d20" stroke-dasharray="3"/><text x="50" y="35" font-size="11" text-anchor="middle">d</text><text x="50" y="86" font-size="9" text-anchor="middle">círculo maciço</text></svg>`;
    const m = Math.max(p.b, p.h) || 1, w = p.b / m * 64, h = p.h / m * 64;
    return `<svg viewBox="0 0 110 90" width="110"><rect x="${50 - w / 2}" y="${40 - h / 2}" width="${w}" height="${h}" fill="#dbeafe" stroke="#155eef" stroke-width="2"/><line x1="${50 - w / 2 - 5}" y1="40" x2="${50 + w / 2 + 5}" y2="40" stroke="#d92d20" stroke-dasharray="3"/><text x="50" y="${40 + h / 2 + 12}" font-size="11" text-anchor="middle">b</text><text x="${50 + w / 2 + 4}" y="43" font-size="11">h</text><text x="50" y="86" font-size="9" text-anchor="middle">retângulo</text></svg>`;
}
// =====================================================================
// 5. CÁLCULO PRINCIPAL (estática + resistência + deslocamentos)
//    Convenções: unidades SI (N, m, Pa) dentro do cálculo
//    Tração = positivo. Forças para cima = positivo. Momento fletor: positivo = tração embaixo
// =====================================================================
function calc() {
    // 5.1 Lê a geometria e limita B e C para ficarem dentro da viga
    let L = lengthToM('L'), B = lengthToM('B'), C = lengthToM('C');
    const err = [];
    if (!(L > 0))
        err.push('O comprimento L deve ser positivo.');
    B = Math.min(Math.max(B, 0), L);
    C = Math.min(Math.max(C, 0), L);
    if (Math.abs(C - B) < 1e-6)
        err.push('B e C não podem coincidir.');
    ['B','C'].forEach(j => { if (!(fieldMM('d_'+j) > 0)) err.push('O diâmetro do pino '+j+' deve ser positivo.'); if (!(fieldMM('tb_'+j) > 0) || !(fieldMM('tm_'+j) > 0)) err.push('As espessuras das peças na ligação '+j+' devem ser positivas.'); });
    // 5.2 Calcula as propriedades das seções (viga, BD, CE) e valida os dados
    const sc = {};
    EL.slice(0, 3).forEach(([k]) => {
        const p = sc[k] = sec(k);
        $('dims_' + k).style.display = p.mode == 'dims' ? '' : 'none';
        $('area_' + k).style.display = p.mode == 'area' ? '' : 'none';
        $('rect_' + k).style.display = p.t == 'r' && p.mode == 'dims' ? '' : 'none';
        $('circ_' + k).style.display = p.t == 'c' && p.mode == 'dims' ? '' : 'none';
        $('areaRect_' + k).style.display = p.t == 'r' && p.mode == 'area' ? '' : 'none';
        $('areaCirc_' + k).style.display = p.t == 'c' && p.mode == 'area' ? '' : 'none';
        $('fig_' + k).innerHTML = fig(p);
        $('pr_' + k).innerHTML = `A = ${fmt(p.A, 1)} mm²<br>I = ${fmt(p.I, 0)} mm⁴<br>W = ${fmt(p.W, 0)} mm³<br>r = ${fmt(p.r, 2)} mm${p.mode == 'area' ? '<br><b>Geometria equivalente:</b> ' + (p.t == 'r' ? `b=${fmt(p.b,2)} mm · h=${fmt(p.h,2)} mm` : `d=${fmt(p.d,2)} mm`) : ''}`;
        if (!(p.A > 0) || !(p.I > 0) || !(p.c > 0))
            err.push('Dimensões ou propriedades geométricas de ' + k + ' inválidas. Confira a área e as dimensões complementares.');
    });
    if (err.length) {
        $('msg').innerHTML = '<span style="color:#b42318">' + err.join('<br>') + '</span>';
        return;
    }
    $('msg').innerHTML = '<span style="color:#07883f;font-weight:700">✓ Calculado.</span>';
    // 5.3 Multiplicador de carga (simulação de aumento progressivo)
    const lam = v('lam') / 100;
    $('lamv').textContent = '×' + fmt(lam, 2);
    const LA = lengthToM('LA'), LB = lengthToM('LB'), mb = mat('beam'), mA = mat('bd'), mB = mat('ce'), sb = sc.beam, sA = sc.bd, sB = sc.ce;
    // 5.4 Converte todas as cargas para N e N·m e soma:
    //     sFy = soma das forças verticais | sFx = soma das horizontais
    //     sMB / sMC = soma dos momentos das cargas em relação a B e a C
    //     Distribuída: resultante Wy = área do trapézio de carga (w1+w2)/2 · comprimento
    const cl = z => Math.abs(z) < 1e-9 ? 0 : z;
    let sFy = 0, sFx = 0, sMB = 0, sMC = 0;
    const items = loads.map(l => {
        const f = (/^kN/.test(l.u) ? 1000 : 1) * lam;
        if (l.t == 'F') {
            const a = l.ang * Math.PI / 180, Fx = cl(l.P * f * Math.cos(a)), Fy = cl(l.P * f * Math.sin(a));
            sFx += Fx;
            sFy += Fy;
            sMB += Fy * (l.x - B);
            sMC += Fy * (l.x - C);
            return { t: 'F', x: l.x, Fx, Fy, id: l.id };
        }
        if (l.t == 'M') {
            const M0 = (l.sense == 'ccw' ? 1 : -1) * l.M0 * f;
            sMB += M0;
            sMC += M0;
            return { t: 'M', x: l.x, M0 };
        }
        let x1 = l.x, x2 = l.x2, a = l.w1, b = l.w2;
        if (x1 > x2) {
            [x1, x2, a, b] = [x2, x1, b, a];
        }
        const len = x2 - x1;
        if (len <= 0)
            return null;
        const s = l.dir == 'down' ? -1 : 1, w1 = s * a * f, w2 = s * b * f, k = (w2 - w1) / len, Wy = (w1 + w2) / 2 * len, q = w1 * len * len / 2 + k * len ** 3 / 6;
        sFy += Wy;
        sMB += Wy * (x1 - B) + q;
        sMC += Wy * (x1 - C) + q;
        return { t: 'Q', x1, x2, w1, w2, k, len, Wy, id: l.id };
    }).filter(Boolean);
    // 5.5 Reações (equilíbrio): R_C pelo momento em B; R_B pelo momento em C
    //     H = reação horizontal em B; barra BD: N = R_B; barra CE: N = -R_C (R_C para cima comprime a CE)
    const R_C = -sMB / (C - B), R_B = -sMC / (B - C), H = -sFx, N_BD = R_B, N_CE = -R_C;
    // 5.6 Diagramas: percorre a viga em 600 pontos e calcula V(x), M(x) e N(x)
    //     V = reações + cargas à esquerda | M = momentos das forças à esquerda | N = -(forças horizontais à esquerda)
    const n = 600, S = [];
    let Mx = { x: 0, M: 0 }, sigC = 0;
    for (let i = 0; i <= n; i++) {
        const x = L * i / n;
        let V = (x >= B ? R_B : 0) + (x >= C ? R_C : 0), M = R_B * Math.max(x - B, 0) + R_C * Math.max(x - C, 0), Fl = x >= B ? H : 0;
        items.forEach(it => {
            if (it.t == 'F' && x >= it.x) {
                V += it.Fy;
                M += it.Fy * (x - it.x);
                Fl += it.Fx;
            }
            else if (it.t == 'M' && x >= it.x)
                M -= it.M0;
            else if (it.t == 'Q' && x > it.x1) {
                const a = Math.min(x, it.x2) - it.x1, W = it.w1 * a + it.k * a * a / 2;
                V += W;
                M += W * (x - it.x1) - (it.w1 * a * a / 2 + it.k * a ** 3 / 3);
            }
        });
        const N = -Fl;
        S.push({ x, V, M, N });
        if (Math.abs(M) >= Math.abs(Mx.M))
            Mx = { x, M };
        sigC = Math.max(sigC, Math.abs(N) / sb.A + Math.abs(M) * 1e3 * sb.c / sb.I);
    }
    // Tensão de flexão máxima: σ = M·c/I (M em N·mm)
    const sigFlex = Math.abs(Mx.M) * 1e3 * sb.c / sb.I;
    // deslocamentos
    // 5.7 Deslocamentos: integra duas vezes a curvatura M/(E·I) e depois ajusta
    //     a deflexão para passar por B e C (que se movem pelo alongamento das barras)
    const EI = mb.E * 1e9 * sb.I * 1e-12, v0 = [0];
    let th = 0, vv = 0;
    const dx = L / n;
    for (let i = 1; i <= n; i++) {
        const t0 = th;
        th += (S[i - 1].M + S[i].M) / 2 / EI * dx;
        vv += (t0 + th) / 2 * dx;
        v0.push(vv);
    }
    const at = x => { const p = x / L * n, i = Math.min(Math.floor(p), n - 1), f = p - i; return v0[i] * (1 - f) + v0[i + 1] * f; };
    // Alongamento das barras: δ = N·L/(E·A). B desce se BD estica; C sobe se CE estica
    const dBD = N_BD * LA / (mA.E * 1e9 * sA.A * 1e-6), dCE = N_CE * LB / (mB.E * 1e9 * sB.A * 1e-6), yB = -dBD, yC = dCE;
    // Reta que liga os deslocamentos de B e C somada à deflexão por flexão
    const b1 = ((yC - at(C)) - (yB - at(B))) / (C - B), a1 = yB - at(B) - b1 * B;
    let dmax = 0, xdm = 0;
    S.forEach((p, i) => { p.y = v0[i] + a1 + b1 * p.x; if (Math.abs(p.y) >= dmax) {
        dmax = Math.abs(p.y);
        xdm = p.x;
    } });
    // 5.8 Pinos: τ = F / (nº pinos · planos de corte · π·d²/4); força de ruptura = τ_rup · área
    const pin = (s, N, barKey) => { const d = fieldMM('d_' + s), np = Math.max(1, Math.round(v('n_' + s))), pl = $('sh_' + s).value == 'double' ? 2 : 1, m = mat('p' + s), A0 = Math.PI * d * d / 4, A = A0 * np * pl, F = Math.abs(N), tBeam = fieldMM('tb_' + s), tMember = fieldMM('tm_' + s), beamMat = mat('beam'), memberMat = mat(barKey); const bearingBeam = { member:'Viga AC', t:tBeam, sigma:F/(np*d*tBeam), fy:beamMat.fy }; const bearingBar = { member:barKey == 'bd' ? 'Barra BD' : 'Barra CE', t:tMember, sigma:F/(np*d*tMember), fy:memberMat.fy }; [bearingBeam,bearingBar].forEach(x => { x.fs = x.sigma < 1e-9 ? Infinity : x.fy/x.sigma; x.c = x.fs < 1 ? 'f' : x.fs < 1.5 ? 'a' : 's'; }); return { s, d, np, pl, A, A0, tau:F/A, tauR:m.tau, Fr:m.tau*A, F, tBeam, tMember, bearing:[bearingBeam,bearingBar] }; };
    const pB = pin('B', N_BD, 'bd'), pC = pin('C', N_CE, 'ce');
    // 5.9 Verificação: fator de segurança FS = limite / tensão atuante
    //     FS < 1 falha | 1 a 1,5 atenção | acima de 1,5 seguro
    const els = [{ n: 'Viga AC', s: sigC, lim: mb.fy, k: 'beam' }, { n: 'Barra BD', s: Math.abs(N_BD) / sA.A, lim: mA.fy, k: 'bd' }, { n: 'Barra CE', s: Math.abs(N_CE) / sB.A, lim: mB.fy, k: 'ce' }, { n: 'Pino B', s: pB.tau, lim: pB.tauR, k: 'pB', pin: 1 }, { n: 'Pino C', s: pC.tau, lim: pC.tauR, k: 'pC', pin: 1 },
        ...pB.bearing.map((b,i) => ({ n: `Esmagamento ${b.member} (B)`, s:b.sigma, lim:b.fy, k:`bearingB${i}`, bearing:1 })),
        ...pC.bearing.map((b,i) => ({ n: `Esmagamento ${b.member} (C)`, s:b.sigma, lim:b.fy, k:`bearingC${i}`, bearing:1 }))];
    els.forEach(e => { e.fs = e.s < 1e-9 ? Infinity : e.lim / e.s; e.c = e.fs < 1 ? 'f' : e.fs < 1.5 ? 'a' : 's'; });
    const st = {};
    els.forEach(e => st[e.k] = e.c);
    pB.c = st.pB;
    pC.c = st.pC;
    pB.fs = els[3].fs;
    pC.fs = els[4].fs;
    // 5.10 Guarda os resultados, atualiza a tela e dispara a animação
    D = { L, B, C, LA, LB, loads: loads.map(l => ({ ...l })), items, lam, R_B, R_C, H, N_BD, N_CE, sFy, sMB, sMC, sFx, S, Mx, sigFlex, sigC, sb, sA, sB, mb, mA, mB, dBD, dCE, yB, yC, dmax, xdm, pB, pC, els, st, at, v0, a1, b1, n };
    render();
    anim.t = 0;
    go();
}
// Animação: a deformação cresce de 0 a 100% em 0,6 segundo
function go() { if (drag) {
    anim.t = 1;
    drawAll();
    return;
} cancelAnimationFrame(anim.id); const t0 = performance.now(); const f = now => { const u = Math.min(1, (now - t0) / 600); anim.t = 1 - Math.pow(1 - u, 3); drawAll(); if (u < 1)
    anim.id = requestAnimationFrame(f); }; anim.id = requestAnimationFrame(f); }
// =====================================================================
// 6. EXIBIÇÃO DOS RESULTADOS NAS TABELAS E CARTÕES
// =====================================================================
const chip = (c, t) => `<span class="chip ${c}">${t}</span>`, lab = (e) => e.fs === Infinity ? chip('n', 'SEM ESFORÇO') : e.c == 's' ? chip('s', 'SEGURO') : e.c == 'a' ? chip('a', 'ATENÇÃO') : chip('f', e.pin ? 'ROMPIDO' : 'FALHA');
const barHtml = e => { const u = e.fs === Infinity ? 0 : Math.min(100, 100 / e.fs); return `<div class="bar"><i style="width:${u}%;background:${e.c == 'f' ? '#dc2626' : e.c == 'a' ? '#eab308' : '#16a34a'}"></i></div>`; };
// Preenche as métricas, tabelas de barras, pinos, deslocamentos e diagnóstico
function render() {
    const d = D, kN = x => fmt(x / 1000);
    const first = [...d.els].sort((a, b) => a.fs - b.fs)[0];
    $('mets').innerHTML = [['Força na barra BD', kN(d.N_BD) + ' kN', d.N_BD >= 0 ? 'tração' : 'compressão'], ['Força na barra CE', kN(d.N_CE) + ' kN', d.N_CE >= 0 ? 'tração' : 'compressão'], ['|M| máximo', kN(Math.abs(d.Mx.M)) + ' kN·m', 'em x = ' + fmt(d.Mx.x) + ' m'],
        ['Tensão máx. na viga', fmt(d.sigC) + ' MPa', 'flexão + axial'], ['Deslocamento máx.', fmt(d.dmax * 1000) + ' mm', 'em x = ' + fmt(d.xdm) + ' m'], ['Menor FS', fmt(first.fs, 2), first.n]].map(m => `<div class="met"><small>${m[0]}</small><b>${m[1]}</b><small>${m[2]}</small></div>`).join('');
    $('quick').innerHTML = `<table><tbody>${d.els.map(e => `<tr><td>${e.n}</td><td>${lab(e)}</td><td>FS = ${fmt(e.fs, 2)}</td></tr>`).join('')}</tbody></table>`;
    $('eq').innerHTML = `<tr><td>ΣFy = F_BD,y + R_C + ΣFy aplicadas</td><td>${fmt((d.R_B + d.R_C + d.sFy) / 1000, 6)} kN</td></tr><tr><td>ΣFx (inclui H em B)</td><td>${fmt((d.sFx + d.H) / 1000, 6)} kN</td></tr><tr><td>Reação vertical do apoio B (R_B, ↑)</td><td>${kN(d.R_B)} kN</td></tr><tr><td>Reação vertical do apoio C (R_C, ↑)</td><td>${kN(d.R_C)} kN</td></tr><tr><td>Reação horizontal H em B</td><td>${kN(d.H)} kN</td></tr>`;
    const bar = (nm, N, s, L, m, dl, k) => `<tr><td>Material</td><td>${matName(k)}</td></tr><tr><td>Esforço axial N</td><td>${kN(N)} kN ${N >= 0 ? chip('s', 'TRAÇÃO') : chip('f', 'COMPRESSÃO')}</td></tr><tr><td>Seção</td><td>${s.t == 'r' ? `retangular ${s.b}×${s.h} mm` : `circular d=${s.d} mm`}</td></tr><tr><td>Área</td><td>${fmt(s.A, 1)} mm²</td></tr><tr><td>Tensão σ</td><td>${fmt(Math.abs(N) / s.A)} MPa (fy = ${m.fy})</td></tr><tr><td>Comprimento</td><td>${fmt(L * 1000, 0)} mm</td></tr><tr><td>Variação de comprimento</td><td>${fmt(dl * 1000, 4)} mm (${dl >= 0 ? 'alongamento' : 'encurtamento'})</td></tr><tr><td>ρ / massa</td><td>${m.rho} kg/m³ / ${fmt(m.rho * s.A * 1e-6 * L, 2)} kg</td></tr><tr><td>Estado</td><td>${lab(d.els.find(e => e.k == k))}</td></tr>`;
    $('tBD').innerHTML = bar('BD', d.N_BD, d.sA, d.LA, d.mA, d.dBD, 'bd');
    $('tCE').innerHTML = bar('CE', d.N_CE, d.sB, d.LB, d.mB, d.dCE, 'ce');
    $('tPins').innerHTML = [d.pB, d.pC].map(p => `<tr><td>${p.s} (d=${fmt(p.d,2)} mm)</td><td>${matName('p'+p.s)}</td><td>${p.np} × ${p.pl}</td><td>${fmt(p.A, 1)} mm²</td><td>${fmt(p.tau)} MPa</td><td>${fmt(p.tauR)} MPa</td><td>${kN(p.Fr)} kN</td><td>${fmt(p.fs, 2)}</td><td>${p.c == 'f' ? chip('f', 'ROMPIDO') : p.c == 'a' ? chip('a', 'PRÓXIMO DO LIMITE') : p.fs === Infinity ? chip('n', 'SEM ESFORÇO') : chip('s', 'SEGURO')}</td></tr>`).join('');
    $('tBearing').innerHTML = [d.pB,d.pC].flatMap(p => p.bearing.map(b => { const c=b.c, status=c=='f'?chip('f','FALHA'):c=='a'?chip('a','ATENÇÃO'):b.fs===Infinity?chip('n','SEM ESFORÇO'):chip('s','SEGURO'); return `<tr><td>${p.s}</td><td>${b.member}</td><td>${fmt(b.t,2)} mm</td><td>${fmt(b.sigma)} MPa</td><td>${fmt(b.fy)} MPa</td><td>${fmt(b.fs,2)}</td><td>${status}</td></tr>`; })).join('');
    const pts = [['A (x=0)', d.at(0) + d.a1], ['B', d.yB], ['C', d.yC], ['D (fixo)', 0], ['E (fixo)', 0], [`Máx. da viga (x=${fmt(d.xdm)} m)`, d.S.reduce((m, p) => Math.abs(p.y) >= Math.abs(m) ? p.y : m, 0)]];
    $('tDisp').innerHTML = pts.map(p => `<tr><td>${p[0]}</td><td>${fmt(p[1] * 1000, 4)} mm</td><td>${Math.abs(p[1]) < 1e-12 ? '—' : p[1] > 0 ? '↑ para cima' : '↓ para baixo'}</td></tr>`).join('');
    $('tBars').innerHTML = `<tr><td>BD: δ = N·L/(E·A)</td><td>${fmt(d.dBD * 1000, 4)} mm — ${d.dBD >= 0 ? 'alongou' : 'encurtou'} (ponto B ${d.yB <= 0 ? 'desce' : 'sobe'})</td></tr><tr><td>CE: δ = N·L/(E·A)</td><td>${fmt(d.dCE * 1000, 4)} mm — ${d.dCE >= 0 ? 'alongou' : 'encurtou'} (ponto C ${d.yC >= 0 ? 'sobe' : 'desce'})</td></tr>`;
    $('tDiag').innerHTML = d.els.map(e => `<tr><td>${e.n}</td><td>${fmt(e.s)} MPa</td><td>${fmt(e.lim)} MPa ${e.pin ? '(τ rup.)' : e.bearing ? '(fy — esmagamento)' : '(fy)'}</td><td>${fmt(e.fs, 2)}</td><td>${lab(e)}</td><td>${barHtml(e)}</td></tr>`).join('');
    const so = [...d.els].filter(e => e.fs !== Infinity).sort((a, b) => a.fs - b.fs);
    $('order').innerHTML = so.length ? `<table><thead><tr><th>Ordem</th><th>Elemento</th><th>Falha com carga ×(carga base)</th><th>Situação atual</th></tr></thead><tbody>${so.map((e, i) => `<tr><td>${i + 1}º</td><td>${e.n}</td><td>${fmt(e.fs * d.lam, 2)}</td><td>${lab(e)}</td></tr>`).join('')}</tbody></table><div class="note" style="margin-top:8px"><b>Mais solicitado / primeiro a falhar: ${so[0].n}</b> — com as cargas atuais (×${fmt(d.lam, 2)}), ele atinge o limite quando as cargas forem multiplicadas por ${fmt(so[0].fs, 2)} (carga base × ${fmt(so[0].fs * d.lam, 2)}). Mova o multiplicador acima para ver o colapso no desenho.</div>` : 'Sem esforços.';
    charts(d);
    validation(d);
}
// Momento fletor calculado pelo trecho DIREITO da viga (conferência independente)
function mRight(d, x) {
    let M = 0;
    if (d.B > x)
        M += d.R_B * (d.B - x);
    if (d.C > x)
        M += d.R_C * (d.C - x);
    d.items.forEach(it => { if (it.t == 'F' && it.x > x)
        M += it.Fy * (it.x - x);
    else if (it.t == 'M' && it.x > x)
        M += it.M0;
    else if (it.t == 'Q' && it.x2 > x) {
        const a = Math.max(it.x1, x), m = 400, h = (it.x2 - a) / m;
        for (let i = 0; i < m; i++) {
            const s = a + (i + .5) * h;
            M += (it.w1 + it.k * (s - it.x1)) * h * (s - x);
        }
    } });
    return M;
}
// Aba Validação: compara o programa com verificações independentes
function validation(d) {
    const Mr = mRight(d, d.Mx.x), sg = Math.abs(d.Mx.M) * 1e3 * d.sb.c / d.sb.I, sg2 = Math.abs(Mr) * 1e3 * d.sb.c / d.sb.I;
    const R_B2 = -d.sFy - d.R_C;
    const rows = [['ΣFy (equilíbrio)', (d.R_B + d.R_C + d.sFy) / 1000, 0, 'kN'], ['ΣM em B', (d.R_C * (d.C - d.B) + d.sMB) / 1000, 0, 'kN·m'], ['R_B (momento em C) × R_B (ΣFy=0)', d.R_B / 1000, R_B2 / 1000, 'kN'], ['|Mmax| (trecho esquerdo) × (trecho direito)', Math.abs(d.Mx.M) / 1000, Math.abs(Mr) / 1000, 'kN·m'], ['σ flexão = M·c/I', d.sigFlex, sg2, 'MPa'], ['τ pino B = F/(n·planos·πd²/4)', d.pB.tau, Math.abs(d.N_BD) / d.pB.A, 'MPa'], ['σ esmagamento viga em B = F/(n·d·t)', d.pB.bearing[0].sigma, Math.abs(d.N_BD)/(d.pB.np*d.pB.d*d.pB.tBeam), 'MPa']];
    $('tVal').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${fmt(r[1], 5)} ${r[3]}</td><td>${fmt(r[2], 5)} ${r[3]}</td><td>${fmt(Math.abs(r[1] - r[2]), 6)}</td></tr>`).join('');
    $('valMsg').innerHTML = `<b>Conferência à mão:</b> ΣM em B: R_C·(x_C − x_B) + Σ[Fy·(x − x_B)] + ΣM₀ = 0 → R_C = ${fmt(d.R_C / 1000)} kN; ΣFy = 0 → R_B = ${fmt(d.R_B / 1000)} kN. Barra BD: N = R_B; barra CE: N = −R_C (R_C ↑ comprime a barra inferior). Tensão σ = N/A; flexão σ = M·c/I; cisalhamento do pino τ = F/(n·planos·πd²/4); esmagamento simplificado σesm = F/(n·d·t), com FS = fy/σesm; deslocamento δ = N·L/(E·A).`;
}
// =====================================================================
// 7. GRÁFICOS N, V e M
// =====================================================================
function charts(d) { [['cN', 'N', 'Esforço normal N(x)', 'kN'], ['cV', 'V', 'Esforço cortante V(x)', 'kN'], ['cM', 'M', 'Momento fletor M(x)', 'kN·m']].forEach(a => drawChart($(a[0]), d.S, a[1], a[2], a[3], d.L, a[1] == 'M')); }
// Desenha um diagrama (área azul, eixos, valor máximo marcado em vermelho)
function drawChart(cv, S, key, title, unit, L) {
    const r = cv.getBoundingClientRect(), w = r.width || 800, h = r.height || 260, ra = devicePixelRatio || 1;
    cv.width = w * ra;
    cv.height = h * ra;
    const c = cv.getContext('2d');
    c.setTransform(ra, 0, 0, ra, 0, 0);
    c.clearRect(0, 0, w, h);
    const val = p => p[key] / 1000;
    let m = Math.max(...S.map(p => Math.abs(val(p))), 0);
    const z = m < 1e-6;
    if (z)
        m = 1;
    const l = 70, rt = 25, t = 45, b = 38, pw = w - l - rt, ph = h - t - b, X = i => l + i / (S.length - 1) * pw, Y = y => t + ph / 2 - y / m * (ph / 2 - 8);
    c.strokeStyle = '#eef2f7';
    c.beginPath();
    for (let i = 0; i <= 10; i++) {
        c.moveTo(l + i / 10 * pw, t);
        c.lineTo(l + i / 10 * pw, h - b);
    }
    [m, m / 2, 0, -m / 2, -m].forEach(y => { c.moveTo(l, Y(y)); c.lineTo(w - rt, Y(y)); });
    c.stroke();
    c.strokeStyle = '#475569';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(l, Y(0));
    c.lineTo(w - rt, Y(0));
    c.stroke();
    c.fillStyle = 'rgba(21,94,239,.18)';
    c.beginPath();
    c.moveTo(X(0), Y(0));
    S.forEach((p, i) => c.lineTo(X(i), Y(val(p))));
    c.lineTo(X(S.length - 1), Y(0));
    c.fill();
    c.strokeStyle = '#155eef';
    c.lineWidth = 2.5;
    c.beginPath();
    S.forEach((p, i) => i ? c.lineTo(X(i), Y(val(p))) : c.moveTo(X(i), Y(val(p))));
    c.stroke();
    c.fillStyle = '#0f172a';
    c.font = 'bold 15px Segoe UI,Arial';
    c.textAlign = 'left';
    c.fillText(title, l - 40, 24);
    c.font = '11px Segoe UI,Arial';
    c.fillStyle = '#64748b';
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    if (!z) {
        c.fillText(fmt(m, 2) + ' ' + unit, l - 8, Y(m));
        c.fillText(fmt(-m, 2) + ' ' + unit, l - 8, Y(-m));
    }
    c.fillText('0', l - 8, Y(0));
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText('0 m', l, h - b + 8);
    c.fillText(fmt(L, 2) + ' m', w - rt, h - b + 8);
    if (!z && key != 'N' || !z) {
        const k = S.reduce((q, p) => Math.abs(p[key]) >= Math.abs(q[key]) ? p : q);
        c.fillStyle = '#d92d20';
        c.textAlign = 'center';
        c.textBaseline = 'bottom';
        c.beginPath();
        c.arc(X(S.indexOf(k)), Y(val(k)), 4, 0, 7);
        c.fill();
        c.fillText(fmt(val(k), 2) + ' ' + unit, X(S.indexOf(k)), Y(val(k)) - 6);
    }
}
// =====================================================================
// 8. DESENHOS (estrutura, deformada e pinos)
// =====================================================================
function drawAll() { if (!D)
    return; drawStructure($('structure'), D); drawStructure($('defCanvas'), D); drawPin($('pinB'), D.pB, 'Pino B'); drawPin($('pinC'), D.pC, 'Pino C'); }
// Cores do estado: verde = seguro, amarelo = atenção, vermelho = falha
const COL = { s: '#16a34a', a: '#eab308', f: '#dc2626' };
// Desenha uma seta de (x1,y1) até (x2,y2)
function arrow(c, x1, y1, x2, y2, hd = 7) { const a = Math.atan2(y2 - y1, x2 - x1); c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - hd * Math.cos(a - .45), y2 - hd * Math.sin(a - .45)); c.lineTo(x2 - hd * Math.cos(a + .45), y2 - hd * Math.sin(a + .45)); c.fill(); }
// Desenho principal: original (contínua), deformada (tracejada + sombra), cargas, pinos e apoios
function drawStructure(cv, d) {
    const r = cv.getBoundingClientRect(), w = r.width || 900, h = r.height || 400, ra = devicePixelRatio || 1;
    cv.width = w * ra;
    cv.height = h * ra;
    const c = cv.getContext('2d');
    c.setTransform(ra, 0, 0, ra, 0, 0);
    c.clearRect(0, 0, w, h);
    const pad = 75, yV = h * .5, s = (w - 2 * pad) / d.L, X = x => pad + x * s, yD = yV - 110, yE = yV + 95;
    const mode = $('ampMode').value, amp = mode == 'real' ? 1 : mode == 'manual' ? v('ampK') : (d.dmax > 0 ? Math.min(5000, Math.max(1, 32 / (d.dmax * s))) : 1), T = anim.t, Y = y => yV - y * s * amp * T;
    d.amp = amp;
    cv._g = { pad, s, yV, d };
    const yA = d.at(0) + d.a1, ys = d.S.map(p => p.y);
    // régua
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1;
    c.fillStyle = '#334155';
    c.font = '11px Arial';
    c.textAlign = 'center';
    const yR = yV + 130;
    c.beginPath();
    c.moveTo(X(0), yR);
    c.lineTo(X(d.L), yR);
    c.stroke();
    [[0, 'A=0'], [d.B, 'B=' + fmt(d.B)], [d.C, 'C=' + fmt(d.C)], [d.L, 'L=' + fmt(d.L)]].sort((a, b) => a[0] - b[0]).forEach((p, i, ar) => { c.setLineDash([2, 3]); c.beginPath(); c.moveTo(X(p[0]), yV + 12); c.lineTo(X(p[0]), yR); c.stroke(); c.setLineDash([]); c.fillText(p[1] + ' m', X(p[0]), yR + 14 + (i && Math.abs(X(p[0]) - X(ar[i - 1][0])) < 48 && i % 2 ? 13 : 0)); });
    // barras originais
    const bc = k => d.st[k] == 'f' ? '#dc2626' : d.st[k] == 'a' ? '#eab308' : null;
    c.lineCap = 'butt';
    c.lineWidth = 8;
    c.strokeStyle = 'rgba(148,163,184,.55)';
    c.beginPath();
    c.moveTo(X(d.B), yV);
    c.lineTo(X(d.B), yD);
    c.moveTo(X(d.C), yV);
    c.lineTo(X(d.C), yE);
    c.stroke();
    c.fillStyle = '#94a3b8';
    c.fillRect(X(d.B) - 25, yD - 12, 50, 12);
    c.fillRect(X(d.C) - 25, yE, 50, 12);
    // deformada
    c.fillStyle = 'rgba(21,94,239,.2)';
    c.beginPath();
    ys.forEach((y, i) => { const x = X(d.S[i].x); i ? c.lineTo(x, Y(y)) : c.moveTo(x, Y(y)); });
    for (let i = ys.length - 1; i >= 0; i--)
        c.lineTo(X(d.S[i].x), yV);
    c.fill();
    c.lineWidth = 7;
    c.strokeStyle = bc('bd') || '#d97706';
    c.setLineDash([7, 5]);
    c.beginPath();
    c.moveTo(X(d.B), yD);
    c.lineTo(X(d.B), Y(d.yB));
    c.stroke();
    c.strokeStyle = bc('ce') || '#4b5563';
    c.beginPath();
    c.moveTo(X(d.C), yE);
    c.lineTo(X(d.C), Y(d.yC));
    c.stroke();
    c.lineWidth = 3;
    c.strokeStyle = bc('beam') || '#0b2450';
    c.beginPath();
    ys.forEach((y, i) => { const x = X(d.S[i].x); i ? c.lineTo(x, Y(y)) : c.moveTo(x, Y(y)); });
    c.stroke();
    c.setLineDash([]);
    // viga original
    c.lineWidth = 11;
    c.lineCap = 'round';
    c.strokeStyle = bc('beam') || '#155eef';
    c.globalAlpha = .9;
    c.beginPath();
    c.moveTo(X(0), yV);
    c.lineTo(X(d.L), yV);
    c.stroke();
    c.globalAlpha = 1;
    // setas de deslocamento
    [[0, yA], [d.B, d.yB], [d.C, d.yC]].forEach(([x, y], i) => {
        const dy = -y * s * amp * T;
        if (Math.abs(dy) > 4) {
            c.strokeStyle = c.fillStyle = '#0b2450';
            c.lineWidth = 1.8;
            arrow(c, X(x) + (i == 2 ? 14 : -14), yV, X(x) + (i == 2 ? 14 : -14), yV + dy);
        }
        c.fillStyle = '#0b2450';
        c.font = 'bold 11px Arial';
        c.textAlign = 'center';
        const txt = `${fmt(y * 1000, 3)} mm ${Math.abs(y) < 1e-12 ? '' : y > 0 ? '↑' : '↓'}`;
        c.fillText(txt, X(x), Y(y) + (y > 0 ? -15 : 24));
    });
    // cargas
    d.loads.forEach((l, i) => {
        const it = l, col = '#d92d20';
        c.strokeStyle = c.fillStyle = col;
        c.lineWidth = 3;
        c.lineCap = 'butt';
        c.font = 'bold 12px Arial';
        c.textAlign = 'left';
        if (l.t == 'F') {
            const a = l.ang * Math.PI / 180, dx = Math.cos(a), dy = -Math.sin(a), px = X(l.x), tx = px - dx * 62, ty = yV - dy * 62;
            arrow(c, tx, ty, px - dx * 8, yV - dy * 8, 9);
            c.beginPath();
            c.arc(tx, ty, 4, 0, 7);
            c.fill();
            c.fillText(`P${i + 1}=${fmt(l.P)} ${l.u} ∠${fmt(l.ang, 1)}°`, tx + 6, ty - 8);
        }
        else if (l.t == 'Q') {
            const x1 = Math.min(l.x, l.x2), x2 = Math.max(l.x, l.x2), a = l.x <= l.x2 ? l.w1 : l.w2, b = l.x <= l.x2 ? l.w2 : l.w1, mx = Math.max(Math.abs(a), Math.abs(b), 1e-9), sg = l.dir == 'down' ? -1 : 1, nA = Math.max(3, Math.round((x2 - x1) * s / 22)), top = [];
            for (let k = 0; k <= nA; k++) {
                const x = x1 + (x2 - x1) * k / nA, hh = Math.abs(a + (b - a) * k / nA) / mx * 46;
                top.push([X(x), yV + sg * (8 + hh)]);
                if (hh > 3)
                    arrow(c, X(x), yV + sg * (8 + hh), X(x), yV + sg * 8, 6);
            }
            c.lineWidth = 2;
            c.beginPath();
            top.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
            c.stroke();
            c.fillText(`q${i + 1}: ${fmt(l.w1)}→${fmt(l.w2)} ${l.u}`, X(x1) + 4, yV + sg * 58 + (sg > 0 ? 12 : -2));
        }
        else {
            const px = X(l.x), cc = l.sense == 'ccw', cy = yV - 38, a0 = -2.4, a1 = .6, P = t => [px + 17 * Math.cos(t), cy + 17 * Math.sin(t)];
            c.lineWidth = 3;
            c.beginPath();
            c.arc(px, cy, 17, a0, a1);
            c.stroke();
            const f = cc ? P(a0 + .3) : P(a1 - .3), e = cc ? P(a0) : P(a1);
            arrow(c, f[0], f[1], e[0], e[1], 9);
            c.fillText(`M${i + 1}=${fmt(l.M0)} ${l.u} ${cc ? '↺' : '↻'}`, px + 24, yV - 36);
        }
    });
    // pinos e apoios
    [['B', d.B, d.yB, d.pB], ['C', d.C, d.yC, d.pC]].forEach(([n, x, y, p]) => {
        const px = X(x), py = Y(y);
        c.beginPath();
        c.arc(px, py, 9, 0, 7);
        c.fillStyle = p.c == 's' && p.fs === Infinity ? '#fff' : COL[p.c];
        c.fill();
        c.lineWidth = 2.5;
        c.strokeStyle = drag == n ? '#d97706' : '#172033';
        c.stroke();
        c.beginPath();
        c.arc(px, n == 'B' ? yD : yE, 5, 0, 7);
        c.fillStyle = '#1e293b';
        c.fill();
        if (p.c == 'f') {
            c.fillStyle = '#dc2626';
            c.font = 'bold 11px Arial';
            c.textAlign = 'center';
            c.fillText('✖ RUPTURA DO PINO ' + n, px, py + (n == 'B' ? -26 : 42));
        }
    });
    d.els.slice(0, 3).forEach((e, i) => { if (e.c == 'f') {
        c.fillStyle = '#dc2626';
        c.font = 'bold 12px Arial';
        c.textAlign = 'left';
        c.fillText('⚠ FALHA: ' + e.n, 12, 66 + i * 16);
    } });
    c.fillStyle = '#0f172a';
    c.font = 'bold 13px Arial';
    c.textAlign = 'left';
    c.fillText('A', X(0) - 16, yV + 5);
    c.fillText('B', X(d.B) - 20, yV - 12);
    c.fillText('C', X(d.C) - 20, yV + 26);
    c.fillText('D', X(d.B) + 10, yD - 4);
    c.fillText('E', X(d.C) + 10, yE + 24);
    c.font = '11px Arial';
    c.fillStyle = '#475569';
    c.fillText(`Contínuo = original · Tracejado/sombreado = deformada · ${mode == 'real' ? 'escala real' : 'ampliação ×' + fmt(amp, 0)}`, 12, 18);
    c.fillText(`L_BD=${fmt(d.LA)} m  L_CE=${fmt(d.LB)} m`, 12, 34);
}
// Desenho ampliado do pino: planos de cisalhamento e animação de ruptura
function drawPin(cv, p, nm) {
    const r = cv.getBoundingClientRect(), w = r.width || 360, h = r.height || 230, ra = devicePixelRatio || 1;
    cv.width = w * ra;
    cv.height = h * ra;
    const c = cv.getContext('2d');
    c.setTransform(ra, 0, 0, ra, 0, 0);
    c.clearRect(0, 0, w, h);
    const col = COL[p.c], np = p.pl + 1, ph = 38, y0 = h / 2 - np * ph / 2 + 6, cx = w / 2, sh = p.c == 'f' ? 13 * anim.t : 0;
    for (let i = 0; i < np; i++) {
        const dir = i % 2 ? 1 : -1, y = y0 + i * ph, o = dir * sh;
        c.fillStyle = i % 2 ? '#cbd5e1' : '#94a3b8';
        c.fillRect(cx - 105 + o, y, 210, ph - 2);
        c.fillStyle = col;
        c.fillRect(cx - 13 + o, y - (i == 0 ? 8 : 0), 26, ph - 2 + (i == 0 || i == np - 1 ? 8 : 0));
        c.strokeStyle = '#172033';
        c.lineWidth = 1;
        c.strokeRect(cx - 13 + o, y - (i == 0 ? 8 : 0), 26, ph - 2 + (i == 0 || i == np - 1 ? 8 : 0));
        c.strokeStyle = c.fillStyle = '#172033';
        c.lineWidth = 2.5;
        const ex = dir < 0 ? cx - 105 + o : cx + 105 + o;
        arrow(c, ex, y + ph / 2, ex + dir * 28, y + ph / 2, 7);
    }
    for (let i = 1; i < np; i++) {
        const y = y0 + i * ph - 1;
        c.setLineDash([4, 3]);
        c.strokeStyle = '#dc2626';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(cx - 120, y);
        c.lineTo(cx + 120, y);
        c.stroke();
        c.setLineDash([]);
    }
    c.fillStyle = '#0f172a';
    c.font = 'bold 13px Arial';
    c.textAlign = 'center';
    c.fillText(`${nm} — ${p.np} pino(s) Ø${p.d} mm, cisalhamento ${p.pl == 2 ? 'duplo' : 'simples'}`, w / 2, 18);
    c.font = '11px Arial';
    c.fillStyle = '#475569';
    c.fillText(`τ = ${fmt(p.tau)} MPa | τ rup. = ${fmt(p.tauR)} MPa | F rup. = ${fmt(p.Fr / 1000)} kN | FS = ${fmt(p.fs, 2)}`, w / 2, h - 26);
    c.font = 'bold 13px Arial';
    c.fillStyle = col;
    c.fillText(p.c == 'f' ? '✖ ROMPIDO (plano de cisalhamento cortado)' : p.c == 'a' ? '⚠ PRÓXIMO DO LIMITE' : '✔ SEGURO', w / 2, h - 8);
}
// interação com o desenho
// ---- Arrastar com o mouse: apoios B e C, posição das forças e ângulo (ponta da seta) ----
const cvs = $('structure');
cvs.addEventListener('pointerdown', e => {
    const g = cvs._g;
    if (!g)
        return;
    const rc = cvs.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top, { pad, s, yV, d } = g, X = x => pad + x * s;
    for (const l of loads.filter(l => l.t == 'F')) {
        const a = l.ang * Math.PI / 180, tx = X(l.x) - Math.cos(a) * 62, ty = yV + Math.sin(a) * 62;
        if (Math.hypot(mx - tx, my - ty) < 14) {
            drag = 'A' + l.id;
            cvs.setPointerCapture(e.pointerId);
            return;
        }
    }
    if (Math.abs(mx - X(d.B)) < 18 && Math.abs(my - yV) < 30)
        drag = 'B';
    else if (Math.abs(mx - X(d.C)) < 18 && Math.abs(my - yV) < 30)
        drag = 'C';
    else
        for (const l of loads.filter(l => l.t != 'Q')) {
            if (Math.abs(mx - X(l.x)) < 14 && my < yV + 10) {
                drag = 'P' + l.id;
                break;
            }
        }
    if (drag)
        cvs.setPointerCapture(e.pointerId);
});
cvs.addEventListener('pointermove', e => {
    if (!drag)
        return;
    const g = cvs._g, rc = cvs.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top, xv = Math.min(g.d.L, Math.max(0, +((mx - g.pad) / g.s).toFixed(2)));
    if (drag == 'B')
        $('B').value = xv;
    else if (drag == 'C')
        $('C').value = xv;
    else {
        const id = +drag.slice(1), l = loads.find(a => a.id == id);
        if (drag[0] == 'P') {
            l.x = xv;
            const el = $(`ld_${id}_x`);
            if (el)
                el.value = xv;
        }
        else {
            const px = g.pad + l.x * g.s;
            let a = Math.atan2(my - g.yV, px - mx) * 180 / Math.PI;
            a = Math.round((a + 360) % 360);
            l.ang = a;
            const el = $(`ld_${id}_ang`);
            if (el)
                el.value = a;
        }
    }
    calc();
});
const endDrag = () => { if (drag) {
    drag = null;
    calc();
} };
cvs.addEventListener('pointerup', endDrag);
cvs.addEventListener('pointercancel', endDrag);
// eventos gerais
$('side').addEventListener('input', e => { const id = e.target.id || ''; let m; if (id.startsWith('m_'))
    setMat(id.slice(2), e.target.value);
else if (m = id.match(/^(E|fy|t|r)_(\w+)$/)) { $('m_' + m[2]).value = 'Personalizado'; setMat(m[2], 'Personalizado'); } calc(); });
$('side').addEventListener('change', e => { const id=e.target.id||''; if(id.startsWith('m_')) setMat(id.slice(2),e.target.value); calc(); });
['lam', 'ampMode', 'ampK'].forEach(i => $(i).addEventListener('input', () => i == 'lam' ? calc() : drawAll()));
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.tab,.panel').forEach(x => x.classList.remove('on')); b.classList.add('on'); $(b.dataset.t).classList.add('on'); anim.t = 1; if (D) {
    charts(D);
    drawAll();
} }));
window.addEventListener('resize', () => { if (D) {
    charts(D);
    drawAll();
} });
// relatório PDF (abre janela de impressão → "Salvar como PDF")
function report() {
    const d = D;
    if (!d)
        return;
    const im = (f, w, h, ...a) => { const c = document.createElement('canvas'); const t = anim.t; anim.t = 1; f(c, ...a); anim.t = t; return `<img src="${c.toDataURL()}" style="width:100%;max-width:${w}px">`; };
    const k = x => fmt(x / 1000), tb = (h, rows) => `<table border="1" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:12px"><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
    const secT = (p) => p.t == 'r' ? `retangular ${p.b}×${p.h} mm` : `circular Ø${p.d} mm`;
    const loadT = d.loads.map((l, i) => l.t == 'F' ? `P${i + 1}: força ${l.P} ${l.u}, ${l.ang}°, x=${l.x} m` : l.t == 'Q' ? `q${i + 1}: distribuída ${l.w1}→${l.w2} ${l.u}, x=${l.x}→${l.x2} m, ${l.dir == 'down' ? '↓' : '↑'}` : `M${i + 1}: momento ${l.M0} ${l.u} ${l.sense == 'ccw' ? '↺' : '↻'}, x=${l.x} m`);
    const html = `<html><head><meta charset="utf-8"><title>Relatório A3</title><style>body{font-family:Arial;margin:24px;color:#111}h1{font-size:20px}h2{font-size:15px;border-bottom:1px solid #999;margin-top:20px}</style></head><body>
<h1>A3 — Relatório da Calculadora Estrutural</h1><small>Resistência dos Materiais I · ${new Date().toLocaleString('pt-BR')}</small>
<h2>1. Dados de entrada</h2><p>L=${d.L} m · B=${d.B} m · C=${d.C} m · L_BD=${d.LA} m · L_CE=${d.LB} m · multiplicador de carga ×${fmt(d.lam, 2)}</p><p>Viga AC: ${secT(d.sb)} · Barra BD: ${secT(d.sA)} · Barra CE: ${secT(d.sB)}</p><p>${loadT.join('<br>')}</p>
<p>Pino B: ${d.pB.np} × Ø${fmt(d.pB.d,2)} mm, ${d.pB.pl} plano(s) · Pino C: ${d.pC.np} × Ø${fmt(d.pC.d,2)} mm, ${d.pC.pl} plano(s)</p><p>Espessuras na ligação B: viga ${fmt(d.pB.tBeam,2)} mm e barra BD ${fmt(d.pB.tMember,2)} mm. Ligação C: viga ${fmt(d.pC.tBeam,2)} mm e barra CE ${fmt(d.pC.tMember,2)} mm.</p>
<h2>2. Materiais</h2>${tb(['Elemento', 'Material', 'E (GPa)', 'fy (MPa)', 'τ rup. (MPa)', 'ρ (kg/m³)'], EL.map(([q, n]) => { const m = mat(q); return [n, matName(q), m.E, m.fy, m.tau, m.rho]; }))}
<h2>3. Modelo e deformada</h2>${im(drawStructure, 900, 0, d)}
<h2>4. Memória de cálculo</h2><p>ΣM_B=0: R_C·(${d.C}−${d.B}) + ${fmt(d.sMB / 1000, 4)} kN·m = 0 → R_C = ${k(d.R_C)} kN<br>ΣFy=0: R_B = ${k(d.R_B)} kN · H em B = ${k(d.H)} kN<br>N_BD = ${k(d.N_BD)} kN · N_CE = −R_C = ${k(d.N_CE)} kN (positivo = tração)<br>|M|máx = ${k(Math.abs(d.Mx.M))} kN·m em x=${fmt(d.Mx.x)} m → σ = M·c/I = ${fmt(d.sigFlex)} MPa (c=${fmt(d.sb.c, 1)} mm, I=${fmt(d.sb.I, 0)} mm⁴)<br>σ_BD = ${fmt(Math.abs(d.N_BD) / d.sA.A)} MPa · σ_CE = ${fmt(Math.abs(d.N_CE) / d.sB.A)} MPa<br>τ_B = ${fmt(d.pB.tau)} MPa · τ_C = ${fmt(d.pC.tau)} MPa<br>δ_BD = N·L/(E·A) = ${fmt(d.dBD * 1000, 4)} mm · δ_CE = ${fmt(d.dCE * 1000, 4)} mm</p>
<h2>5. Diagramas N, V, M</h2>${im(drawChart, 800, 0, d.S, 'N', 'Esforço normal N(x)', 'kN', d.L)}${im(drawChart, 800, 0, d.S, 'V', 'Esforço cortante V(x)', 'kN', d.L)}${im(drawChart, 800, 0, d.S, 'M', 'Momento fletor M(x)', 'kN·m', d.L)}
<h2>6. Deslocamentos</h2>${tb(['Ponto', 'Deslocamento vertical (mm, ↑+)'], [['A', fmt((d.at(0) + d.a1) * 1000, 4)], ['B', fmt(d.yB * 1000, 4)], ['C', fmt(d.yC * 1000, 4)], ['D / E', '0 (fixos)'], ['Máx. viga', fmt(d.dmax * 1000, 4) + ' em x=' + fmt(d.xdm) + ' m']])}
<h2>7. Verificação dos pinos</h2>${tb(['Pino', 'τ atuante', 'τ ruptura', 'F ruptura (kN)', 'FS', 'Estado'], [d.pB, d.pC].map(p => ['Pino ' + p.s, fmt(p.tau), fmt(p.tauR), k(p.Fr), fmt(p.fs, 2), p.c == 'f' ? 'ROMPIDO' : p.c == 'a' ? 'ATENÇÃO' : 'SEGURO']))}
<h2>8. Esmagamento das chapas (critério simplificado)</h2><p>σesm = F/(n·d·t) e FS = fy/σesm. A tensão de escoamento fy é utilizada como referência simplificada para a pressão média de contato; não substitui uma verificação normativa completa de ligações.</p>${tb(['Ligação','Peça','Espessura (mm)','σ esm (MPa)','fy (MPa)','FS','Estado'], [d.pB,d.pC].flatMap(p => p.bearing.map(b => [p.s,b.member,fmt(b.t,2),fmt(b.sigma),fmt(b.fy),fmt(b.fs,2),b.c=='f'?'FALHA':b.c=='a'?'ATENÇÃO':'SEGURO'])))}
<h2>9. Diagnóstico final</h2>${tb(['Elemento', 'Tensão (MPa)', 'Limite (MPa)', 'FS', 'Resultado'], d.els.map(e => [e.n, fmt(e.s), fmt(e.lim), fmt(e.fs, 2), e.c == 'f' ? (e.pin ? 'ROMPIDO' : 'FALHA') : e.c == 'a' ? 'ATENÇÃO' : 'SEGURO']))}
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
        alert('Permita pop-ups para gerar o relatório.');
        return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
}
// Início: carrega o caso-teste e calcula pela primeira vez
restore();

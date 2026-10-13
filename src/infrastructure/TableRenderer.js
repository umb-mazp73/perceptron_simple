import { formatNumber as fmt } from './formatNumber.js';

const paren = (n, d = 2) => (n < 0 ? `(${fmt(n, d)})` : fmt(n, d));
const bit = (v) => (v === 1 || v === -1 ? `<span class="${v === 1 ? 'pos' : 'neg'}">${v}</span>` : fmt(v, 2));

export class TableRenderer {
  renderTrainingHistory(container, history, learningRate) {
    this.#renderPaginated(container, history, 1, ([epoch]) => this.#buildTrainingTable(epoch, learningRate), 'Iteración');
  }

  renderEvaluation(container, results, rowsPerPage = 16) {
    this.#renderPaginated(container, results, rowsPerPage, (page) => this.#buildEvaluationTable(page), 'Página');
  }

  #renderPaginated(container, items, pageSize, buildTableFn, label) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    let currentPage = 1;

    const renderPage = () => {
      container.innerHTML = '';
      if (items.length === 0) {
        container.innerHTML = '<p class="empty">Sin datos todavía.</p>';
        return;
      }
      const start = (currentPage - 1) * pageSize;
      container.appendChild(buildTableFn(items.slice(start, start + pageSize)));

      if (totalPages > 1) {
        container.appendChild(
          this.#buildPagination(currentPage, totalPages, label, (page) => {
            currentPage = page;
            renderPage();
          }),
        );
      }
    };

    renderPage();
  }

  #buildPagination(currentPage, totalPages, label, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pagination';

    const makeBtn = (text, page, disabled) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pagination-btn';
      btn.textContent = text;
      btn.disabled = disabled;
      btn.addEventListener('click', () => onChange(page));
      return btn;
    };

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `${label} ${currentPage} de ${totalPages}`;

    wrapper.append(
      makeBtn('« Primera', 1, currentPage === 1),
      makeBtn('‹ Anterior', currentPage - 1, currentPage === 1),
      info,
      makeBtn('Siguiente ›', currentPage + 1, currentPage === totalPages),
      makeBtn('Última »', totalPages, currentPage === totalPages),
    );
    return wrapper;
  }

  #buildTrainingTable(epoch, learningRate) {
    const wrapper = document.createElement('div');

    const caption = document.createElement('p');
    caption.className = 'table-caption';
    caption.innerHTML = `Iteración <b>${epoch.epochNumber}</b> · errores en la iteración: <b class="${epoch.totalErrors === 0 ? 'ok' : 'warn'}">${epoch.totalErrors}</b>`;
    wrapper.appendChild(caption);

    const table = document.createElement('table');
    table.className = 'data-table';
    table.appendChild(this.#buildHeader([
      'Fila', 'x1', 'x2', 'x3', 'x4', 'w1', 'w2', 'w3', 'w4', 'θ', 'Y = tanh(Σwx − θ)', 'Salida', 'Esperado', '',
    ]));

    const tbody = document.createElement('tbody');
    epoch.details.forEach((d, idx) => {
      const row = document.createElement('tr');
      row.classList.add(d.correct ? 'row-success' : 'row-error');
      row.innerHTML = `
        <td>Y${idx + 1}</td>
        ${d.inputs.map((x) => `<td>${bit(x)}</td>`).join('')}
        ${d.weightsUsed.map((w) => `<td>${fmt(w, 2)}</td>`).join('')}
        <td>${fmt(d.thetaUsed, 2)}</td>
        <td>tanh(${fmt(d.net, 4)}) = ${fmt(d.y, 4)}</td>
        <td>${bit(d.output)}</td>
        <td>${bit(d.expected)}</td>
        <td>${d.correct ? '✔' : '✘ reajusta'}</td>
      `;
      tbody.appendChild(row);

      if (d.adjustment) {
        const adj = document.createElement('tr');
        adj.className = 'row-adjust';
        const E = fmt(learningRate, 2);
        const Y = paren(d.expected, 0);
        const lines = d.weightsUsed.map(
          (w, i) => `w${i + 1} = ${paren(w)} + 2 · ${E} · ${Y} · ${paren(d.inputs[i], 0)} = <b>${fmt(d.adjustment.weights[i], 2)}</b>`,
        );
        lines.push(`θ  = ${paren(d.thetaUsed)} + 2 · ${E} · ${Y} · (-1) = <b>${fmt(d.adjustment.theta, 2)}</b>`);
        adj.innerHTML = `<td colspan="14"><div class="adjust-box">${lines.map((l) => `<code>${l}</code>`).join('')}</div></td>`;
        tbody.appendChild(adj);
      }
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }

  #buildEvaluationTable(results) {
    const table = document.createElement('table');
    table.className = 'data-table';
    table.appendChild(this.#buildHeader(['#', 'x1', 'x2', 'x3', 'x4', 'net = Σwx − θ', 'Y = tanh(net)', 'Salida', 'Esperado', 'Resultado']));

    const tbody = document.createElement('tbody');
    results.forEach((r) => {
      const row = document.createElement('tr');
      if (r.correct !== null) row.classList.add(r.correct ? 'row-success' : 'row-error');
      row.innerHTML = `
        <td>${r.index}</td>
        ${r.inputs.map((x) => `<td>${bit(x)}</td>`).join('')}
        <td>${fmt(r.net, 4)}</td>
        <td>${fmt(r.y, 6)}</td>
        <td>${bit(r.output)}</td>
        <td>${r.expected === null ? '—' : bit(r.expected)}</td>
        <td>${r.correct === null ? 'fuera de la tabla' : r.correct ? '✔ Correcto' : '✘ Incorrecto'}</td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    return table;
  }

  #buildHeader(labels) {
    const thead = document.createElement('thead');
    const row = document.createElement('tr');
    labels.forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      row.appendChild(th);
    });
    thead.appendChild(row);
    return thead;
  }
}

export class TableRenderer {
  renderTrainingHistory(container, history, epochsPerPage = 4) {
    this.#renderPaginated(container, history, epochsPerPage, (pageEpochs) =>
      this.#buildTrainingTable(pageEpochs),
    );
  }

  renderEvaluation(container, results, rowsPerPage = 8) {
    this.#renderPaginated(container, results, rowsPerPage, (pageResults) =>
      this.#buildEvaluationTable(pageResults),
    );
  }

  #renderPaginated(container, items, pageSize, buildTableFn) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    let currentPage = 1;

    const renderPage = () => {
      container.innerHTML = '';
      const start = (currentPage - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize);
      container.appendChild(buildTableFn(pageItems));

      if (totalPages > 1) {
        container.appendChild(
          this.#buildPagination(currentPage, totalPages, (page) => {
            currentPage = page;
            renderPage();
          }),
        );
      }
    };

    renderPage();
  }

  #buildPagination(currentPage, totalPages, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pagination';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '‹ Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => onChange(currentPage - 1));

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Página ${currentPage} de ${totalPages}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = 'Siguiente ›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => onChange(currentPage + 1));

    wrapper.append(prevBtn, info, nextBtn);
    return wrapper;
  }

  #buildTrainingTable(epochResults) {
    const table = document.createElement('table');
    table.className = 'data-table';

    table.appendChild(this.#buildHeader([
      'Época', 'x1', 'x2', 'Esperado', 'Obtenido', 'Error', 'w1', 'w2', 'Bias', 'Errores en la época',
    ]));

    const tbody = document.createElement('tbody');
    epochResults.forEach((epochResult) => {
      epochResult.details.forEach((detail, idx) => {
        const row = document.createElement('tr');
        if (epochResult.totalErrors === 0) row.classList.add('row-success');
        row.innerHTML = `
          <td>${idx === 0 ? epochResult.epochNumber : ''}</td>
          <td>${detail.x1}</td>
          <td>${detail.x2}</td>
          <td>${detail.expected}</td>
          <td>${detail.predicted}</td>
          <td>${detail.error}</td>
          <td>${epochResult.weights[0].toFixed(4)}</td>
          <td>${epochResult.weights[1].toFixed(4)}</td>
          <td>${epochResult.bias.toFixed(4)}</td>
          <td>${idx === 0 ? epochResult.totalErrors : ''}</td>
        `;
        tbody.appendChild(row);
      });
    });

    table.appendChild(tbody);
    return table;
  }

  #buildEvaluationTable(results) {
    const table = document.createElement('table');
    table.className = 'data-table';

    table.appendChild(this.#buildHeader(['#', 'x1 (real)', 'x2 (real)', 'Esperado', 'Predicho', 'Resultado']));

    const tbody = document.createElement('tbody');
    results.forEach((r) => {
      const row = document.createElement('tr');
      row.classList.add(r.correct ? 'row-success' : 'row-error');
      row.innerHTML = `
        <td>${r.index}</td>
        <td>${r.x1}</td>
        <td>${r.x2}</td>
        <td>${r.expected}</td>
        <td>${r.predicted}</td>
        <td>${r.correct ? '✔ Correcto' : '✘ Incorrecto'}</td>
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

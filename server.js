const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const port = 3001;

const plantasPath = path.join(__dirname, 'plantas.json');
const plantasData = fs.readFileSync(plantasPath, 'utf-8');
const plantas = JSON.parse(plantasData);

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function criarCard(planta) {
    return `
    <div class="col-md-3">
                <div class="planta-box">
                <div class="planta-inner-box position-relative">
                    <div class="icons">
                        <a href="#" class="text-decoration-none"></a>
                    </div>
                    <div class="onsale position-absolute top-0 start-0">
                        <span class="badge rounded-0">${planta.propriedades}
                        </span>
                    </div>
                    <img src="${planta.url_foto}" alt="" class="img-fluid">
        
                    <div class="cart-btn">
                        <a href="/excluir-planta"><button class="btn btn-light shadow-sm rounded-pill">Excluir Planta</button></a>
                    </div>
                </div>
                <div class="planta-info">
                    <div class="planta-nome mt-4">
                        <h3>${planta.nome_popular}</h3>
                    </div>
                    <div class="planta-propriedade"><span>${planta.nome_cientifico}</span></div>
                </div>
            </div>
            </div>
    `;
}
app.get('/', (req, res) => {
    const cardsHtml = plantas.map(planta => criarCard(planta)).join('');
    const pageHtmlPath = path.join(__dirname, 'index.html');
    let pageHtml = fs.readFileSync(pageHtmlPath, 'utf-8');
    pageHtml = pageHtml.replace('{{cardsHtml}}', cardsHtml);
    res.send(pageHtml);
});


function salvarDados(plantas) {
    fs.writeFileSync(plantasPath, JSON.stringify(plantas, null, 2));
  }

app.get('/atualizar-propriedadePlanta', (req, res) => {
    res.sendFile(path.join(__dirname, 'atuPropriedade.html')); 
});

app.post('/atualizar-propriedadePlanta', (req, res) => {
    const { nome_popular, novaPropriedade} = req.body;
    const propriedadeIndex = plantas.findIndex(planta => planta.nome_popular.toLowerCase() === nome_popular.toLowerCase());

    if (propriedadeIndex === -1) {
        res.send('<h1>Planta não encontrada.</h1>');
        return;
    }

    plantas[propriedadeIndex].propriedades = novaPropriedade;

    salvarDados(plantas);

    res.send(`<h2>Propriedade da Planta <em>${nome_popular}</em> atualizada com sucesso!</h2>`);
});


function buscarPlantaPorNomePopular(nome_popular) {
    return plantas.find(planta =>
        planta.nome_popular.toLowerCase() === nome_popular.toLowerCase());
}

app.get('/filtrar-planta', (req, res) => {
    res.sendFile(path.join(__dirname, 'filtrar.html')); 
});

app.get('/buscar-planta/:nome_popular', (req, res) => {
    const nomeDaPlantaBuscado = req.query.nome_popular;

    const plantaEncontrada = buscarPlantaPorNomePopular(nomeDaPlantaBuscado);

    if (plantaEncontrada) {
      const templatePath = path.join(__dirname, 'saidaFiltro.html');
      const templateData = fs.readFileSync(templatePath, 'utf-8');

        const html = templateData
        .replace('{{nome_cientifico}}', plantaEncontrada.nome_cientifico)
        .replace('{{nome_popular}}', plantaEncontrada.nome_popular)
        .replace('{{carac_gerais}}', plantaEncontrada.carac_gerais)
        .replace('{{propriedades}}', plantaEncontrada.propriedades)
        .replace('{{url_foto}}', plantaEncontrada.url_foto);

        res.send(html);
    } else {
        res.send(`<h1>Planta não encontrada.</h1>`);
    }
});

app.get('/adicionar-planta', (req, res) => {
    res.sendFile(path.join(__dirname, 'adicionar.html')); 
});

app.post('/adicionar-NovaPlanta', (req, res) => {
    const novaPlanta = req.body;

    if (plantas.find(planta => planta.nome_popular === novaPlanta.nome_popular)) {
        res.send('<h1>Planta já adicionada, não é possível adicionar novamente</h1>');
        return;
    }

    plantas.push(novaPlanta);
    salvarDados(plantas, plantasPath);

    res.send(`<h1>Planta adicionada com sucesso!</h1>`);
});



app.get('/excluir-planta', (req, res) => {
    const plantas = JSON.parse(fs.readFileSync(plantasPath, 'utf-8'));
  
    let html = '<h1>Excluir Planta</h1><ul>';
    plantas.forEach(planta => {
      html += `<li>${planta.nome_popular} 
        <button class="btn btn-light shadow-sm rounded-pill" onclick="confirmarExclusao('${planta.nome_popular}')">Excluir</button>
      </li>`;
    });
    html += '</ul>';
    
    html += `
      <script>
        function confirmarExclusao(nome_popular) {
          if (confirm('Tem certeza que deseja excluir a planta "' + nome_popular + '"?')) {
            window.location.href = '/excluir-planta-confirmado?nome_popular=' + encodeURIComponent(nome_popular);
          }
        }
      </script>
    `;
  
    res.send(html);
  });

  app.get('/excluir-planta-confirmado', (req, res) => {
    const { nome_popular } = req.query;
    
    if (excluirPlanta(nome_popular, plantas, plantasPath)) {
      res.send(`<h1>A planta "${nome_popular}" foi excluída com sucesso!</h1><a href="/excluir-planta">Voltar</a>`);
    } else {
      res.send('<h1>Planta não encontrada</h1><a href="/excluir-planta">Voltar</a>');
    }
  });

  function excluirPlanta(nome_popular, plantas, filePath) {
    const index = plantas.findIndex(planta => planta.nome_popular === nome_popular);
    if (index !== -1) {
      plantas.splice(index, 1);
      fs.writeFileSync(filePath, JSON.stringify(plantas, null, 2));
      return true;
    }
    return false;
  }
  
  app.get('/galeria', (req, res) => {
    res.sendFile(path.join(__dirname, 'galeria.html')); 
});

app.listen(port, () => {
    console.log(`Servidor iniciado em http://localhost:${port}`);
});
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cron = require('node-cron');
const thesaurus = require('thesaurus'); // Asegúrate de haber instalado esta biblioteca: npm install thesaurus
const path = require('path');

// Lista de URLs a scrapear
const urls = [
    'https://nuevodiariodesalta.com.ar/clasificados/',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=2',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=3',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=4',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=5',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=6',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=7',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=8',
    'https://nuevodiariodesalta.com.ar/clasificados/?sf_paged=9',
];

// Función para reescribir contenido utilizando el diccionario de sinónimos
function rewriteContent(content) {
    return content.split(' ').map(word => {
        const synonyms = thesaurus.find(word, 'spa_AR');
        return synonyms.length > 0 ? synonyms[0] : word;
    }).join(' ');
}

// Función para generar el HTML del navbar
function generateNavbar(category, currentPage) {
    const navbar = `
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <a class="navbar-brand" href="#"><img src="logo.png" width="60px" alt="Logo"></a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ml-auto">
                <li class="nav-item ${category === 'inicio' ? 'active' : ''}">
                    <a class="nav-link" href="index.html">Inicio ${category === 'inicio' ? '<span class="sr-only">(current)</span>' : ''}</a>
                </li>
                <li class="nav-item ${category === 'empleos' ? 'active' : ''}">
                    <a class="nav-link" href="empleos-1.html">Empleos</a>
                </li>
                <li class="nav-item ${category === 'alquileres' ? 'active' : ''}">
                    <a class="nav-link" href="alquileres-1.html">Alquileres</a>
                </li>
                <li class="nav-item ${category === 'compraVenta' ? 'active' : ''}">
                    <a class="nav-link" href="compraVenta-1.html">Compra/Venta</a>
                </li>
                <li class="nav-item ${category === 'construccion' ? 'active' : ''}">
                    <a class="nav-link" href="construccion-1.html">Construcción</a>
                </li>
                <li class="nav-item ${category === 'varios' ? 'active' : ''}">
                    <a class="nav-link" href="varios-1.html">Varios</a>
                </li>
            </ul>
        </div>
    </nav>`;

    return navbar;
}

// Función para generar el HTML de los anuncios
function generateHTMLFile(category, classifieds, page) {
    const adsenseScript1 = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6115667685103314" crossorigin="anonymous"></script>`;
    const adsenseScript2 = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6115667685103314" crossorigin="anonymous"></script>`;
    const navbar = generateNavbar(category, page); // Generar el navbar actualizado
    const footer = `
    <footer class="footer mt-auto py-3 bg-light">
        <div class="container">
            <span class="text-muted">&copy; ${new Date().getFullYear()} Trabajando Juntos. Por un mejor mañana.</span>
        </div>
    </footer>`;

    let content = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${category.charAt(0).toUpperCase() + category.slice(1)} - Página ${page}</title>
        <link rel="stylesheet" href="style.css">
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    </head>
    <body>
        ${adsenseScript1}
        ${adsenseScript2}
        ${navbar}
        <div class="container mt-5">
            <div class="row">\n`;

    classifieds.forEach(classified => {
        content += `
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">${classified.titulo}</h5>
                        <p class="card-text">${classified.contenido}</p>
                    </div>
                </div>
            </div>`;
    });

    content += `
            </div>
            <div class="d-flex justify-content-between mt-4">
                <a href="${category}-${page > 1 ? page - 1 : 1}.html" class="btn btn-warning btn-lg mr-2">Página Anterior</a>
                <a href="${category}-${page + 1}.html" class="btn btn-success btn-lg mr-2">Página Siguiente</a>
            </div>
        </div>
        ${footer}
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.3/dist/umd/popper.min.js"></script>
        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </body>
    </html>`;

    return content;
}

// Función para guardar los archivos HTML
function saveHTMLFiles(category, classifieds) {
    const itemsPerPage = 10;
    const pages = Math.ceil(classifieds.length / itemsPerPage);

    for (let page = 1; page <= pages; page++) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageClassifieds = classifieds.slice(start, end);

        const htmlContent = generateHTMLFile(category, pageClassifieds, page);
        const filePath = path.join(__dirname, `${category}-${page}.html`); // Guardar en el mismo directorio del script

        fs.writeFileSync(filePath, htmlContent, 'utf8');
    }
}

// Función para realizar el scraping de una página
async function scrapePage(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const items = $('.cl-layout__item');
        const classifieds = [];

        items.each((index, element) => {
            const titleElement = $(element).find('.card-clasificados-titulo');
            const contentElement = $(element).find('.card-clasificados-contenido');

            if (titleElement.length && contentElement.length) {
                let title = titleElement.text().trim() || 'Sin Título';
                let content = contentElement.text().trim() || 'Sin Contenido';

                // Reescribir el contenido
                title = rewriteContent(title);
                content = rewriteContent(content);

                const classified = {
                    titulo: title,
                    contenido: content,
                };

                classifieds.push(classified);
            }
        });

        return classifieds;
    } catch (error) {
        console.error('Error en el scraping:', error);
        return [];
    }
}

// Función para inicializar el scraping y la generación de archivos
async function initializeScraping() {
    try {
        const allClassifieds = [];

        // Iterar sobre todas las URLs y scrapear los datos
        for (const url of urls) {
            const scrapedData = await scrapePage(url);
            allClassifieds.push(...scrapedData);
        }

        // Categorizar los anuncios según el título y guardar archivos HTML
        const categories = {
            'empleos': [],
            'alquileres': [],
            'compraVenta': [],
            'construccion': [],
            'varios': [],
        };

        allClassifieds.forEach(classified => {
            if (classified.titulo.toLowerCase().includes('empleo')) {
                categories['empleos'].push(classified);
            } else if (classified.titulo.toLowerCase().includes('alquiler')) {
                categories['alquileres'].push(classified);
            } else if (classified.titulo.toLowerCase().includes('compra') || classified.titulo.toLowerCase().includes('venta')) {
                categories['compraVenta'].push(classified);
            } else if (classified.titulo.toLowerCase().includes('construcción')) {
                categories['construccion'].push(classified);
            } else {
                categories['varios'].push(classified);
            }
        });

        for (const [category, classifieds] of Object.entries(categories)) {
            saveHTMLFiles(category, classifieds);
        }

        console.log('Scraping y generación de archivos completados.');
    } catch (error) {
        console.error('Error al inicializar el scraping:', error);
    }
}

// Programar la tarea para que se ejecute de lunes a sábado a las 9:00 am
cron.schedule('0 9 * * 1-6', async () => {
    await initializeScraping();
}, {
    scheduled: true,
    timezone: "America/Argentina/Salta"
});

// Ejecutar el script al iniciar
(async () => {
    try {
        console.log('Ejecutando inicialización...');
        await initializeScraping();
        console.log('Inicialización completa. El script está listo para las tareas programadas.');
    } catch (error) {
        console.error('Error en la inicialización:', error);
    }
})();

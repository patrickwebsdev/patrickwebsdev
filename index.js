require('dotenv').config();
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

const PROJECT_GRAPHQL_FIELDS = `
query {
  projectCollection (order: sys_publishedAt_DESC, limit:2) {
    items {
      title
      description
      url
      thumbnail {
        url
      }
    }
  }
}
`;

async function fetchProjects() {
  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CONTENTFUL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: PROJECT_GRAPHQL_FIELDS }),
    }
  );
  const data = await response.json();
  return data.data.projectCollection.items;
}

; (async () => {
  try {
    const markdownTemplate = await readFile('./README.tpl', { encoding: 'utf-8' });
    let projects = '';
    const projectsData = await fetchProjects();
    console.info("Datos obtenidos correctamente");

    projectsData.forEach((project) => {
      projects += `<a href="${project.url}" target="blank"><img src="${project.thumbnail.url}?fit=fill&w=390&r=5" alt="${project.title + " | " + project.description}" width="390px"></a>\n`;
    });

    const finalTemplate = markdownTemplate.replace('%{{latest_projects}}', projects).replace('%{{date}}', new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' }));
    fs.writeFileSync('README.md', finalTemplate);
    console.info("README Escrito con exito");
  } catch (error) {
    console.error(error);
  }
})();

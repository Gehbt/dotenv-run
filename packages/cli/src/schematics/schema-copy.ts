import * as cpy from 'cpy';

async function copySchema(name: string) {
  await cpy([`src/schematics/${name}/schema.json`], `dist/schematics/${name}`);
}

export default async function () {
  await copySchema('ng-add');
}

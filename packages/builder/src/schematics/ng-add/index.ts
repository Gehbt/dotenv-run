import { normalize } from "@angular-devkit/core";
import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { getWorkspace, WorkspaceProject } from "../../utils/workspace";

function writeBuilder(
  project: WorkspaceProject,
  target: string,
  builder: string,
  mandatory = false
) {
  if (!project?.architect?.[target]) {
    if (mandatory) {
      throw new SchematicsException(
        `Cannot read the output path(architect.build.serve.builder) in angular.json`
      );
    }
    return;
  }
  project.architect[target] = {
    ...project.architect[target],
    builder,
  };
}

export function builder(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const { path: workspacePath, workspace } = getWorkspace(tree);

    if (!options.project) {
      if (workspace.defaultProject) {
        options.project = workspace.defaultProject;
      } else {
        console.warn("No default project specified in the workspace");
        const projectNames = Object.getOwnPropertyNames(
          workspace.projects
        ).filter(
          (project) => workspace.projects[project].projectType === "application"
        );
        if (projectNames.length === 0) {
          throw new SchematicsException(
            "No application project found in the workspace"
          );
        }
        if (projectNames.length > 1) {
          projectNames.forEach((projectName) =>
            console.log(` - ng add @ngx-env/builder --project ${projectName}`)
          );
          throw new SchematicsException(
            "Multiple projects detected in the workspace, run one of the commands above"
          );
        }
        options.project = projectNames[0];
      }
    }

    const project: WorkspaceProject = workspace.projects[options.project];
    if (!project) {
      throw new SchematicsException(
        "The specified Angular project is not defined in this workspace"
      );
    }

    if (project.projectType !== "application") {
      throw new SchematicsException(
        `@ngx-env/builder requires an Angular project type of "application" in angular.json`
      );
    }

    writeBuilder(project, "build", "@ngx-env/builder:browser", true);
    writeBuilder(project, "serve", "@ngx-env/builder:dev-server", true);
    writeBuilder(project, "test", "@ngx-env/builder:karma");
    writeBuilder(project, "extract-i18n", "@ngx-env/builder:extract-i18n");
    writeBuilder(project, "server", "@ngx-env/builder:server");

    tree.overwrite(workspacePath, JSON.stringify(workspace, null, 2));
    return tree;
  };
}

export default function (options: any): Rule {
  return chain([
    mergeWith(apply(url("./template"), [move(normalize("./src"))])),
    builder(options),
  ]);
}

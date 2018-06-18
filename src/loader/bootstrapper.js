import React from 'react';
import serialize from 'serialize-javascript';
import treeWalker from 'react-tree-walker';
import RenderManager from './RenderManager';

export default function bootstrapper(app, render, context = {}) {
  const visitor = (element, instance) => {
    if (instance && typeof instance.bootstrap === 'function') {
      return instance.bootstrap();
    }

    return undefined;
  };

  treeWalker(app, visitor, context)
    .then(() => {
      RenderManager.setPhaseToFirstRender();

      const errors = RenderManager.getErrors();

      render({
        getScriptTag: () =>
          `<script charset="UTF-8">window.__LOADER_ERRORS__=${serialize(errors)};</script>`,
        /* eslint-disable react/no-danger */
        getScriptElement: () => <script dangerouslySetInnerHTML={{ __html: errors }} />,
        /* eslint-enable */
      });

      RenderManager.setPhaseToRender();
    })
    // eslint-disable-next-line no-console
    .catch(error => console.error(error));
}

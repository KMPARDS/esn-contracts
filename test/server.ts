import ganache from 'ganache-core';

export const startGanacheServer = (options: ganache.IServerOptions) => {
  const server = ganache.server(options);
  server.listen(options.port, () => {
    console.log('\x1b[2m%s\x1b[0m', `      Ganache Started on ${options.port}..`);
  });
  return server;
};

import ganache from 'ganache-core';

export const startGanacheServer = (port: number = 7545) => {
  const server = ganache.server();
  server.listen(port, () => {
    console.log('\x1b[2m%s\x1b[0m', `      Ganache Started on ${port}..`);
  });
  return server;
};

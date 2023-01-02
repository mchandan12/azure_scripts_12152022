/* eslint-disable linebreak-style */
const applicationServices = require('../api/services/ApplicationServices');

test('Item', async () => {
  const data = await applicationServices.getApplicationDetails(1, 2);
  console.log('Result', data);
  expect(data).toBe(3);
});

test('cum', async () => {
  const data = await applicationServices.getApplicationDetails(3, 4);
  expect(data).toBe(7);
});

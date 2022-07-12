const cron = require('node-cron');
const jne = require('../helpers/jne');
const { Order } = require('../app/models');
const { orderStatus } = require('../constant/status');
const statusMapper = require('../helpers/status-mapper');

const trackingJne = async () => {
  try {
    const order = await Order.findAll({
      where: { status: orderStatus.WAITING_PICKUP },
    });

    Promise.all(
      order?.map(async (item) => {
        const track = await jne.tracking({ resi: '0152952200024477' });

        if (!track?.error) {
          const currentStatus = statusMapper.jneConverter(track?.cnote?.pod_status);

          await Order.update(
            {
              where: { resi: item.resi },
              status: currentStatus,
            },
          );

          // await OrderLog.create({
          //   currentStatus,
          //   orderId: item.orderId,
          //   previousStatus: statusMapper.jneConverter(track?.history[track?.length - 1]),
          //   note: track?.cnote?.last_status,
          // });
        }
      }) || [],
    );
  } catch (error) {
    throw new Error(error);
  }
};

const runner = cron.schedule('* * * * *', async () => {
  // eslint-disable-next-line no-console
  console.info('tracking scheduler run');

  try {
    await trackingJne();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error.message);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});

module.exports = runner;

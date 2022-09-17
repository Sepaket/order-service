const httpErrors = require('http-errors');
const { Ticket, Order, Seller } = require('../../../models');
const jwtSelector = require('../../../../helpers/jwt-selector');
const snakeCaseConverter = require('../../../../helpers/snakecase-converter');

module.exports = class {
  constructor({ request }) {
    this.order = Order;
    this.ticket = Ticket;
    this.seller = Seller;
    this.request = request;
    this.converter = snakeCaseConverter;
    return this.process();
  }

  process() {
    return new Promise(async (resolve, reject) => {
      const { params } = this.request;
      const seller = await jwtSelector({ request: this.request });

      this.ticket.findOne({
        attributes: [
          ['id', 'ticket_id'],
          'title',
          'message',
          'category',
          'priority',
          'file',
          'comment',
          'createdAt',
        ],
        where: {
          id: params.id,
          sellerId: seller.id,
        },
        include: [
          {
            model: this.order,
            as: 'order',
            required: true,
            attributes: [
              ['id', 'order_id'],
              'resi',
            ],
          },
          {
            model: this.seller,
            as: 'seller',
            required: true,
            attributes: [
              ['id', 'seller_id'],
              'name',
            ],
          },
        ],
      }).then((response) => {
        const result = this.converter.objectToSnakeCase(
          JSON.parse(JSON.stringify(response)),
        );

        if (response) resolve(result);
        else reject(httpErrors(404, 'No Data Found', { data: null }));
      }).catch((error) => {
        reject(error);
      });
    });
  }
};

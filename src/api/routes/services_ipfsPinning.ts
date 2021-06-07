import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import ipfsPinning from '../../services/ipfsPinning';
import middlewares from '../middlewares';
import { celebrate, Joi } from 'celebrate';
import { handleResponse } from '../../helpers/utilsHelper';

const route = Router();

export default (app: Router) => {
  app.use('/services/ipfsPinning', route);

  /**
   * Send Message
   * @description Send a notification via the aave showrunner
   * @param {boolean} simulate whether to send the actual message or simulate message sending
   */
  route.post(
    '/pin_all_notif',
    celebrate({
      body: Joi.object({
        simulate: [Joi.bool(), Joi.object()],
      }),
    }),
    middlewares.onlyLocalhost,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /services/ipfsPinning/pin_all_notif endpoint with body: %o', req.body )
      try {
        const ipfsPin = Container.get(ipfsPinning);
        const { success,  data } = await ipfsPin.pinAllNotif(req.body.simulate);

        return handleResponse(res, 201, true, success, data);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return handleResponse(res, 500, false, 'error', JSON.stringify(e));
      }
    },
  );

};

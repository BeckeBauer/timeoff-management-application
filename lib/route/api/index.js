
"use strict";

const
  express = require('express'),
  i18n = require('../../i18n'),
  router = express.Router();


const NOTIFICATION_TYPE_PENDING_REQUESTS = 'pending_request';

/**
 *  Factory method that created a notification of given type
 */
const newNotification = ({type, value, language}) => {
  if (type === NOTIFICATION_TYPE_PENDING_REQUESTS) {
    return {
      type,
      numberOfRequests: value,
      label: i18n.translate(
        value === 1 ? 'A leave request to process' : `${value} leave requests to process`,
        language
      ),
      link: '/requests/',
    }
  }

  return null;
};

router.get('/notifications/', async (req, res) => {
  const actingUser = req.user;

  const data = [];

  try {
    const leaves = await actingUser.promise_leaves_to_be_processed();

    if (leaves.length > 0) {
      data.push(newNotification({
        type: NOTIFICATION_TYPE_PENDING_REQUESTS,
        value: leaves.length,
        language: actingUser.preferred_language,
      }));
    }

    res.json({data});
  } catch (error) {
    console.log(`Failed to fetch notifications for user [${actingUser.id}]: ${error} at ${error.stack}`);
    res.json({ error: 'Failed to fetch notifications.' });
  }
});

module.exports = router;
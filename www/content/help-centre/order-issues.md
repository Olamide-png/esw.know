---
title: "Order Queries"
description: Common order queries.
aside: false
prevNext: false
---



## Configure Welcome Mat Landing Page Content

::steps
### :smart-icon{name="lucide:sticky-note" size=30} Go to *Content Slots* settings 

*Online Marketing > Content Slots settings*.

### :smart-icon{name="lucide:settings" size=30} Configure Landing Page Content

Make the necessary `eswLandingContent` content slot configurations.
::

::tabs{variant="line"}

  ::div{label="Preview"}
  The welcome mat can be configured to display an alert for returning shoppers who are traveling or accessing the storefront from a different country. To enable this, set the `custom preference` value to `True`.

  When the preference is set to `True`, the welcome mat will display the following alert to returning shoppers:

  ::alert{type="secondary" icon="lucide:info"}
  We noticed that you are currently accessing our website from a different country than your last visit. To view all the latest products and prices available in your area, please confirm your delivery country. If no changes are required, you can ignore this warning.
  ::

  Shoppers can then use the links in the alert to update their shipping country, language, and currency.
  ::

  ::div{label="Code"}
  ```md
  The welcome mat can be configured to display an alert for returning shoppers who are traveling or accessing the storefront from a different country. To enable this, set the `custom preference` value to `True`.

  When the preference is set to `True`, the welcome mat will display the following alert to returning shoppers:

  ::alert{type="secondary" icon="lucide:info"}
  We noticed that you are currently accessing our website from a different country than your last visit. To view all the latest products and prices available in your area, please confirm your delivery country. If no changes are required, you can ignore this warning.
  ::

  Shoppers can then use the links in the alert to update their shipping country, language, and currency.
  ```
  ::
::

::tabs{variant="line"}

  ::div{label="Preview"}
  1. Go to the **Online Marketing > Content Slots** settings.  
  2. Perform the `eswGeoIpChangeWarning` content slot configuration. The steps can be found here.
  ::

  ::div{label="Code"}
  ```md
  1. Go to the **Online Marketing > Content Slots** settings.  
  2. Perform the `eswGeoIpChangeWarning` content slot configuration. The steps can be found here.
  ```
  ::
::


::tabs{variant="line"}

  ::div{label="Welcome Mat Alert for Returning Shoppers"}
  The welcome mat can be configured to display an alert for returning shoppers who are traveling or accessing the storefront from a different country. To enable this, set the `custom preference` value to `True`.

  When the preference is set to `True`, the welcome mat will display the following alert to returning shoppers:

  ::alert{type="secondary" icon="lucide:info"}
  We noticed that you are currently accessing our website from a different country than your last visit. To view all the latest products and prices available in your area, please confirm your delivery country. If no changes are required, you can ignore this warning.
  ::

  Shoppers can then use the links in the alert to update their shipping country, language, and currency.
  ::

  ::div{label="Configure Welcome Mat to Display an Alert"}

  ::card
  ---
  img: /Welcome mat 2.png
  imgClass: w-1/2
  ---
  #title
  Welcome Mat Alert For Returning Shoppers.

  #content
  Configuring Welcome Mat display alert for returning shoppers.
  ::

  1. Go to the **Online Marketing > Content Slots** settings.  
  2. Perform the `eswGeoIpChangeWarning` content slot configuration. The steps can be found here.

  ::alert{type="note" icon="lucide:pencil"}
  The welcome mat alert will only be shown to returning shoppers who have previously set a shipping country, language, and currency in your store.
  ::
  ::

::
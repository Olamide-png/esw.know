---
title: "Order Queries"
description: Common order queries.
aside: false
prevNext: false
toc: true
---

::hero-alt
---
announcement:
  title: 'Order FAQs'
  icon: 'lucide:package-open'
actions:
  - name: Help Center
    to: /getting-started
  - name: Knowledge Center
    variant: ghost
    to: /getting-started
mobileRight: 'top' # 'top' | 'bottom'
---

#title
Order Issues

#description
Common Queries
::


<div style="display: flex; justify-content: center; align-items: center; width: 100%;">
  <div style="max-width: 800px; width: 100%;">
    <script async src="https://js.storylane.io/js/v2/storylane.js"></script>
    <div class="sl-embed" style="position:relative;padding-bottom:56.25%;width:100%;height:0;transform:scale(1)">
      <iframe loading="lazy" class="sl-demo" src="https://demo.esw.com/demo/qqk5g03mtfbu?embed=inline" name="sl-embed" allow="fullscreen" allowfullscreen style="position:absolute;top:0;left:0;width:100%!important;height:100%!important;border:1px solid rgba(63,95,172,0.35);box-shadow: 0px 0px 18px rgba(26, 19, 72, 0.15);border-radius:10px;box-sizing:border-box;"></iframe>
    </div>
  </div>
</div>

<br>

<div>
  <script async src="https://js.storylane.io/js/v2/storylane.js"></script>
  <div class="sl-embed" style="position:relative;padding-bottom:56.25%;width:100%;height:0;transform:scale(1)">
    <iframe loading="lazy" class="sl-demo" src="https://demo.esw.com/demo/qqk5g03mtfbu?embed=inline" name="sl-embed" allow="fullscreen" allowfullscreen style="position:absolute;top:0;left:0;width:100%!important;height:100%!important;border:1px solid rgba(63,95,172,0.35);box-shadow: 0px 0px 18px rgba(26, 19, 72, 0.15);border-radius:10px;box-sizing:border-box;"></iframe>
  </div>
</div>

::tabs

  ::div{label="Tracking an Order" icon="streamline-ultimate-color:delivery-truck-3"}

  Follow these steps to track an order:

  ::steps{:level="4"}

  #### :smart-icon{name="streamline-ultimate-color:space-rocket-earth" size=50} Install link

  ::alert{icon="streamline-sharp-color:link-share-2-flat"}
  Click the install link <a href="https://apps.shopify.com/esw-card-payments" target="_blank" rel="noopener noreferrer">here</a>.
  ::

  #### :smart-icon{name="streamline-ultimate-color:app-window-text" size=50} Install app

  #### :smart-icon{name="streamline-ultimate-color:laptop-user" size=50} Contact ESW onboarding manager

  #### :smart-icon{name="streamline-ultimate-color:app-window-two" size=50} Confirmation screen

  ::
  ::div{label="Missing or Delayed Order" icon="streamline-emojis:package"}
  <!-- Add content for missing or delayed order here -->
  ::
  ::div{label="Report Order Discrepancies" icon="streamline-ultimate-color:alarm-bell-ring"}
  <!-- Add content for reporting order discrepancies here -->
  ::
  ::div{label="Escalation" icon="streamline-ultimate-color:alarm-bell-check-1"}
  <!-- Add content for escalation here -->
::





::tabs
  ::div{label="PostgreSQL" icon="lucide:database"}
  

  ```ts
  import { integer, pgTable } from 'drizzle-orm/pg-core';

  export const table = pgTable('table', {
    int: integer('int')
  });
  ```
  ::
  ::div{label="MySQL"}
  

  ```ts
  import { int, mysqlTable } from 'drizzle-orm/mysql-core';

  const table = mysqlTable('table', {
    int: int('int')
  });
  ```
  ::
  ::div{label="SQLite"}
  

  ```ts
  import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';

  const table = sqliteTable('table', {
    id: integer('id')
  });

  // you can customize integer mode to be number, boolean, timestamp, timestamp_ms
  integer('id', { mode: 'number' });
  integer('id', { mode: 'boolean' });
  integer('id', { mode: 'timestamp_ms' });
  integer('id', { mode: 'timestamp' }); // Date
  ```
  ::
::

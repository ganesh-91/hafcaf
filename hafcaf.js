/**
 * hafcaf is initialized as a module using a plain old JavaScript object (POJO). This embarassingly simple setup - which does not hide any private functions or variables - was chosen for its simplicity and the fact that everything was meant to be publicly accessible.
 * @module hafcaf
 */
const hafcaf = {
  /**
   * @typedef {Object} route
   * @prop {string} id  - The identifier to be used for this route.
   * @prop {string} [linkClass]=null - What classname(s) to add to the 'a' tags used to create menu items.
   * @prop {string} [linkHTML]=null - What HTML/text to use when creating a menu item for this route. A menu item will not be created if linkHTML is not provided.
   * @prop {string} [linkTagClass] - What css classes to give to the menu item container for this route.
   * @prop {string} [pageClass] - What css classes to give to the page for this route.
   * @prop {string} [innerHTML] - The content of the page. If not provided, will default to config.loadingHTML. Can be set or overwritten later using hafcaf.updateRoute().
   * @prop {function} [onRender] - A function which will be called each time this route is rendered (made active). Can include multiple functions within itself, if desired. When composing your onRender, keep in mind to take advantage of the hafcaf.listeners collection, which can be used to hold removeEventListener calls and other functions you would like to run when hafcaf switches away from this route.
   */

  /**
   * @member {route[]} routes
   * @static
   * @description A collection of all of the routes registered with hafcaf.
   */
  routes: [],

  /**
   * @typedef {Object} config
   * @prop {string} activeClass="active" - What classname(s) to apply to the link container for the current route.
   * @prop {string} [linkClass]=null - What classname(s) to add to the 'a' tags used to create menu items.
   * @prop {string} linkTag="li" - What tag to use for the link container for a route's menu item.
   * @prop {string} [linkTagClass]=null - What classname(s) to give to the menu item container for this route.
   * @prop {string} loadingHTML - The default HTML to display when a route hasn't yet been updated with its real content. Useful when loading routes dynamically using AJAX or Fetch.
   * @prop {string} mainID="main-container" - The id attribute of the container to which pages should be added.
   * @prop {string} navID="nav-list" - The id attribute of the container to which menu items should be added.
   * @prop {string} [pageClass]=null - What css classnames to give to route pages.
   * @prop {string} pageTag="div" - What tag to use when creating a page's container.
   */

  /** @member {config} config */
  config: {
    activeClass: "active",
    linkClass: null,
    linkTag: "li",
    linkTagClass: null,
    loadingHTML: "<p>Loading...</p>",
    mainID: "main-container",
    navID: "nav-list",
    pageClass: null,
    pageTag: "div"
  },

  /**
   * @property {array} exitFunctions - Holds a collection of functions to be called when the current route changes, as a convenience for onRender functions that add event listeners and the like. Especially useful for cancelling subscriptions to streams or long-polling operations. Will get automatically called at the beginning of every routeChange() call.
   * @type {Function[]}
   */
  exitFunctions: [],

  /**
   * addRoute() is the method to use when you wish to add a route for hafcaf to keep track of. It takes a configuration object, all properties of which are optional except for `id`.
   * @param {route} newRoute
   */
  addRoute: newRoute => {
    let id = newRoute.id;

    // Check if a route already exists with the given ID
    if (this.routes[id] !== undefined) {
      console.error(
        `A route with the ID ${id} already exists. Please use the updateRoute() method if you wish to update it, or change this route's ID if you still want to add it.`
      );
      return;
    }

    // Add the route to the collection of routes
    this.routes[id] = newRoute;

    // Add the route to the navigation menu if linkHTML provided
    if (newRoute.linkHTML) {
      var newEl = document.createElement(this.config.linkTag);

      if (newRoute.linkTagClass || this.config.linkTagClass) {
        newEl.classList.add(newRoute.linkTagClass || this.config.linkTagClass);
      }

      var newLink = document.createElement("a");
      newLink.href = `#${id}`;
      newLink.innerHTML = newRoute.linkHTML;

      // Add classes to the link, if present
      if (newRoute.linkClass || this.config.linkClass) {
        newLink.classList.add(newRoute.linkClass || this.config.linkClass);
      }

      newEl.appendChild(newLink);
      document.getElementById(this.config.navID).appendChild(newEl);
    }

    // Check if the ID already exists in the DOM (i.e. adding an existing page to the dom)
    const doesNotExist = document.getElementById(id) === null;

    if (doesNotExist) {
      // Create a new page
      var newEl = document.createElement(this.config.pageTag);
      newEl.id = id;

      // Add classes to the page, if present
      if (newRoute.pageClass || this.config.pageClass) {
        newEl.classList.add(newRoute.pageClass || this.config.pageClass);
      }

      // If this new route provides html, add it to the DOM, else use the loadingHTML
      newEl.innerHTML = newRoute.innerHTML || this.config.loadingHTML;

      // Add page to the DOM
      document.getElementById(this.config.mainID).appendChild(newEl);
    }

    // Get the new hash, which is the route to be rendered
    const currentRouteID = location.hash.slice(1);

    if (id === currentRouteID) this.routeChange();
  },

  /**
   * @property {string} - The id attribute of the route to redirect to if hafcaf is asked to redirect to a route that doesn't exist. When creating your initial html, this should be the last page in the list of pages in your page container.
   */
  defaultRouteID: "home",

  /**
   * updateRoute() is used - naturally - to update a route's content. In addition to the page's content, one can also update the route's link's innerHTML and the route's onRender function. updateRoute() calls routeChange() at the end if the user is currently viewing the route that was just updated.
   * @param {route} routeToUpdate
   */
  updateRoute: routeToUpdate => {
    let id = routeToUpdate.id;
    const route = this.routes[id];

    if (!route) {
      console.error(`A route with the ID ${id} does not exist, cannot update it.`);
      return false;
    }

    if (routeToUpdate.linkHTML) {
      // First, find the link's 'a' tag by looking up the link's href
      const linkEl = document.querySelector(`a[href='#${id}']`);

      // Then, update the link's innerHTML with the new content
      linkEl.innerHTML = routeToUpdate.linkHTML;
    }

    if (routeToUpdate.innerHTML) {
      // First, find the page via its id
      const pageEl = document.getElementById(id);

      // Then, update the page's innerHTML with the new content
      pageEl.innerHTML = routeToUpdate.innerHTML;
    }

    if (routeToUpdate.onRender) route.onRender = routeToUpdate.onRender;

    // Get the new hash, which is the route to be rendered
    const currentRouteID = location.hash.slice(1);

    if (id === currentRouteID) this.routeChange();
  },

  /**
   * routeChange() is a function called by hafcaf everytime a route is changed. You likely will not ever need to call it directly. The first thing it does is check to make sure the route desired is being tracked by hafcaf already. If it is, then the next step is to remove the `activeClass` from any existing elements that might have it. Third, if there are any functions in {@link hafcaf.exitFunctions}, then call those. Fourthly, find the menu item for the new active route and make it active. Finally, if the new route has an `onRender` function registered, call it.
   */
  routeChange: () => {
    // Get the new hash, which is the route to be rendered
    const routeID = location.hash.slice(1);

    // From the routes known to hafcaf, pick out the matching one
    // If the desired route is not found, redirect to default page
    let route = this.routes[routeID] || this.routes[this.defaultRouteID];

    // If the default route doesn't exist yet either, return early
    if (!route) return;

    // Remove any existing active classes upon route changing
    const { activeClass } = this.config;
    for (var el of document.getElementsByClassName(activeClass)) {
      el.classList.remove(activeClass);
    }

    // Iterate through the exitFunctions collection and call any functions found there
    for (var len = this.exitFunctions.length; len > 0; len--) {
      // Dispose all of the registered exit functions
      this.exitFunctions.pop()();
    }

    // Next, find the new route's 'a' tag by looking up the link's href
    const linkEl = document.querySelector(`a[href='#${route.id}']`);

    // Make it active
    if (linkEl) linkEl.classList.add(activeClass);

    // If the route has an "onRender" callback, call it
    if (route.onRender !== undefined) route.onRender();

    // Last but not least, make sure the hash location gets updated in case of redirection
    window.location.hash = route.id;
  },

  /**
   * The init() function assigns its config object as the config (defaults) for hafcaf. Though it's recommended to only change the individual values needed, this option is provided in case you wish to change several or all values at once.
   *
   * init() additionally sets up a "hashchange" event listener on the window object, so that the routeChange() function will be called when the route changes. Finally, init() will set the hash to the defaultRouteID if it has not already been set (for instance, when following a link to a hafcaf site or refreshing a page) and will then call hafcaf.routeChange() to make sure the pertinent routines are executed.
   * @param {config} config
   */
  init: config => {
    if (config) this.config = config;

    // Add a global listener for 'hashchange', since this framework relies on hash-based routing
    window.addEventListener("hashchange", () => {
      this.routeChange();
    });

    // Set hash to default if no hash
    if (!window.location.hash) {
      window.location.hash = this.defaultRouteID;
    }

    this.routeChange();
  }
};

export default hafcaf;

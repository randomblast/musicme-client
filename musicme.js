/**
 * MusicMe Frontend.
 * @description UI functions for the MusicMe.
 * @copyright Luke Channings 2011
 * @param Elements - Object containing interface elements.
 * @param SettingsOverride - Object containing settings overrides.
 */
function MusicMe(Elements,SettingsOverride)
{
	
	// Make sure there is an elements object.
	if ( typeof Elements !== "object" ) throw("MusicMe: Elements object required.");
	
	/**
	 * Default Settings Object
	 * @description MusicMe settings.
	 */
	var Settings = {
		"SortBy" : ["artist","album","track"], // Sort collection setting.
		"UseDragAndDrop" : true, // Drag-and-Drop support.
		"UseKeyboardShortcuts" : true, // Bindings for keyboard shortcuts.
		"DefaultVolume" : 1, // Default volume at 50% of maximum.
		"Server" : "http://127.0.0.1/", // Domain or IP of the MusicMe Server.
		"PlayingInfoType" : "Remaining",
		"Debug" : false // Debugging bool.
	};
	
	// Check for a settings override.
	if ( typeof SettingsOverride == "object" )
	{
		// Check for Settings.Server.
		if ( ! SettingsOverride.Server && window.console && Settings.Debug)
		{
			console.log("No Server passed. Using localhost as Server.");
		}

		// Loop through each setting property.
		for ( var i in SettingsOverride )
		{	
			// Override default settings.
			Settings[i] = SettingsOverride[i];
		}
	}
	
	// Define the playlist object.
	var Playlist = {
		"Index" : 0,
		"Player" : new Audio(),
		"Queue" : [],
		"ItemCount" : 0, // Number of items in the playlist.
		"Duration" : 0 // The duration of the playlist in seconds.
	};
	
	// Define the collection object.
	var Collection = {
		"ItemCount" : 0
	}
	
	// Define Interace.
	var Interface = {};
	
	// Disable debugging if there is no console to log to.
	if ( ! window.console && Settings.Debug ) Settings.Debug = false;
	
	// Set the Player default volume.
	Playlist.Player.volume = Elements.Ranges.Volume.value = Settings.DefaultVolume;
	
	// Check for a custom init function.
	if ( typeof Settings.CustomInitialisation == "function" )
	{
		// Integrate the custom init.
		this.Init = Settings.CustomInitialisation;
	}
	else
	{
		// Define default init function.
		this.Init = function()
		{
			// Populate the collection.
			Collection.Init();
			
			// Initialise the Playlist.
			Playlist.Init();
			
		}
	}
	
	/**
	 * _XHR
	 * @description XMLHttpRequest Function.
	 * @param URI - The URI to make the request from.
	 * @param Callback - Function that will be sent the response.
	 * @param NullResponseOK - If true, _XHR will not display a modal error if no response is returned.
	 * @param PostData - If using POST, PostData should contain an instance of FormData with the necessary parameters.
	 */
	function _XHR( URI, PostData, Callback , NullResponseOK )
	{
		// Check for a callback function.
		if ( typeof Callback !== "function" )
		{
			throw("_XHR: Need a callback function.");
			
			return;
		}
		
		// Instantiate an XHR.
		var XHR = new XMLHttpRequest();
		
		// Check for Post Data.
		if ( PostData )
		{
			// Set request details.
			XHR.open("POST", URI, true);
			
			// Send the request.
			XHR.send(PostData);
		}
		
		// If there is not Post Data then send a GET request.
		else
		{
			XHR.open("GET", URI, true);
			
			XHR.send(null);
		}
		
		// Run when the data is returned...
		XHR.onreadystatechange = function(){
			if ( XHR.readyState === 4 )
			{
				// If there was a result.
				if ( XHR.responseText && XHR.status == 200 )
				{
					console.log(XHR.responseText);
					
					// Send the result to the callback.
					Callback(XHR.responseText);
				}
				
				// If there was no result and a null response is not OK.
				else if ( ! NullResponseOK )
				{
					// Check for modal.
					if ( Interface.Modal )
					{
						Interface.Modal.Create({
							Class: "error",
							Title: "An Error Has Occurred",
							BodyText: ["MusicMe made a request to the server which was not responded to.","This error could be caused by either an internal bug, or the result of a misconfigured setting, and will likely have an impact on the usability of MusicMe.","Please check <em>Settings.Server</em> in <em>index.html</em> and make sure it's value is correct.","Your server is configured to <a href='" + Settings.Server + "'>" + Settings.Server + "</a> Please check this is correct."],
							Buttons : [
								{
									Title: "Close",
									Callback: Interface.Modal.Close
								}
							]
						});
						
					}
					
					// If there is no modal then throw an exception.
					else throw("_XHR: Request did not return a result.")
				}
			}
		}
	}
	
	/**
	 * _FormatTime
	 * @description Format a time in seconds to 0:0 time.
	 */
	function _FormatTime( seconds )
	{
	    var minutes = Math.floor(seconds / 60);
	    minutes = (minutes >= 10) ? minutes : "0" + minutes;
	    var seconds = Math.floor(seconds % 60);
	    seconds = (seconds >= 10) ? seconds : "0" + seconds;
	    return [minutes,seconds];
	}
	
	/**
	 * _UnformatTime
	 * @description Get the duration in seconds from a time formatted "00:00".
	 */
	function _UnformatTime( formatted )
	{
		var explode = formatted.split(":");
		
		return parseInt((explode[0] * 60)) + parseInt(explode[1]);
	}
	
	/**
	 * _FormatDuration
	 * @description Format a duration in seconds to hours, minutes and seconds.
	 */
	function _FormatDuration( seconds )
	{
		var hours = Math.floor(seconds / Math.pow(60,2));
		var minutes = Math.floor((seconds / 60) - (hours * 60));
		var seconds = seconds % 60;
		var durations = [hours,minutes,seconds];
		
		var formatted = "";
		
		for ( var i in durations )
		{
			// If there are no hours then skip hours.
			if ( i == 0 && durations[0] == 0 ) continue;
			
			// If there are no hours and minutes then skip minutes.
			if ( i == 1 && durations[1] == 0 && durations[0] == 0) continue;
			
			formatted += durations[i] + " ";
			
			if ( i == 0 ) formatted += ( durations[0] > 1 ) ? "Hours, " : "Hour, ";
			else if ( i == 1 ) formatted += ( durations[1] > 1 ) ? "Minutes, " : "Minutes, ";
			else if ( i == 2 ) formatted += ( durations[2] > 1 ) ? "Seconds." : "Seconds.";
		}
		
		return formatted;
	}
	
	/**
	 * _GetElementIndex
	 * @description Determine the index of an element in a list.
	 * @param child - HTMLElement to be checked.
	 */
	function _GetElementIndex(child)
	{
		// Check we were passed an actual element.
		if ( child instanceof HTMLElement )
		{
			// Get the parent node.
			var parent = child.parentNode;
			
			// Loop through parent nodes.
			for ( var i = 0; i < parent.children.length; i++ )
			{
				if ( parent.children[i] == child ) return i;
			}
		}
		
		// If there is no element, then throw the error.
		else throw("No Element.");
	}
	
	/**
	 * _PreventDefault
	 * @description Prevents the default action of an event.
	 */
	function _PreventDefault(e)
	{
		if ( e.preventDefault ) e.preventDefault();
		
		if ( e.returnValue ) e.returnValue = false;
		
		return false;
	}
	
	// Define the ContextMenu Object.
	Interface.ContextMenu = {};
	
	/**
	 * Interface.ContextMenu.Create
	 * @description Spawns a menu at the coordinates of the click with the specified items.
	 * @param ContextMenuObject - menu object literal. Provide X & Y coordinates + items sub-object.
	 */
	Interface.ContextMenu.Create = function(ContextMenuObject)
	{
		// Check for a menu object.
		if ( typeof ContextMenuObject == "object" )
		{
			
			// Destroy any previous menus.
			Interface.ContextMenu.Close();
			
			// Create a new menu.
			var MenuElement = document.createElement("ol");
			
			// Signal Interface.ContextMenu.Close safe to remove.
			MenuElement.setAttribute("data-safetoremove","Yes");
			
			// Give the menu an ID.
			MenuElement.className = "contextmenu";
			
			// Apply X and Y coordinates to the menu.
			MenuElement.setAttribute("style", "top: " + ContextMenuObject.y + "px; left: " + ContextMenuObject.x + "px");
			
			// Loop through menu items.
			for ( var n in ContextMenuObject.items )
			{
				// Check that the item is complete.
				if ( ! ContextMenuObject.items[n].name || ! ContextMenuObject.items[n].callback ) continue;
				
				// Create a menu item.
				var item = document.createElement("li");
								
				// Give the item a name.
				item.innerHTML = ContextMenuObject.items[n].name;
				
				// Bind a callback to the click event.
				item.addEventListener("click",ContextMenuObject.items[n].callback,false);
				
				// Check for a title.
				if ( ContextMenuObject.items[n].title )
				{
					// Add the title if one exists.
					item.setAttribute("title", ContextMenuObject.items[n].title);
				}
				
				// Append the item to the menu.
				MenuElement.appendChild(item);
			}
			
			// Append the menu to the document.
			document.body.appendChild(MenuElement);
			
			// Disable Scrolling.
			document.addEventListener("mousewheel",_PreventDefault,false);
		}
		
		// If there is no menu object then throw an error.
		else throw("ContextMenu.Create was called without a menu object."); return;
	}
	
	/**
	 * Interface.ContextMenu.Close
	 * @description Closes the open context menu.
	 */
	Interface.ContextMenu.Close = function()
	{
		// Get the menu element.
		var context_menus = document.querySelectorAll(".contextmenu");
		
		for ( var i = 0; i < context_menus.length; i++ )
		{
			// Check menu is safe to remove.
			if ( context_menus[i].getAttribute("data-safetoremove") == "Yes" )
			{
				// Remove the previous menu item.
				context_menus[i].parentNode.removeChild(context_menus[i]);
			}
		}
		
		// Enable scrolling.
		document.removeEventListener("mousewheel",_PreventDefault,false);
	}
	
	// Remove all context menus on document click.
	document.addEventListener("click",Interface.ContextMenu.Close,false);
	
	// Disable browser context menus. (We're using our own.)
	document.addEventListener("contextmenu",_PreventDefault,false);
	
	/**
	 * Interface.Modal
	 * @description Methods to hide and show the modal overlay.
	 */
	if ( Elements.ModalOverlay )
	{
		// Create the Modal Interface Object.
		Interface.Modal = {};
		
		/**
		 * Interface.Modal.Create
		 * @description Create a modal dialogue.
		 * @param MDO - Object containing properties for the modal dialogue.
		 */
		Interface.Modal.Create = function ( MDO )
		{
			// Check for a Modal Dialogue Object
			if ( typeof MDO == "object" )
			{
			
				// Create a new modal element with the Modal ID.
				var Modal = document.createElement("div"); Modal.id = "modal";
				
				// Check for a custom class.
				if ( MDO.Class )
				{
					Modal.classList.add(MDO.Class);
				}
				
				// If there are multiple views then use Navigation.
				if ( MDO.Views )
				{
					// Add the navigation class to the Modal dialogue.
					Modal.classList.add("usenav");
					
					// Create Navigation list. (Add Navigation class.)
					var Navigation = document.createElement("ol"); Navigation.className = "Navigation";
					
					// Append the Navigation list to the Modal dialogue.
					Modal.appendChild(Navigation);
					
					// Check for a Multi-View title.
					if ( MDO.Title && Navigation )
					{
						// Create the Title element and add its class.
						var Title = document.createElement("li"); Title.className = "Title";
						
						// Populate the title.
						Title.innerHTML = MDO.Title;
						
						// Append the Title to the Navigation.
						Navigation.appendChild(Title);
					}
					
					// Create the views parent.
					var Views = document.createElement("div"); Views.className = "views";
					
					// Loop through panes.
					for ( var i in MDO.Views )
					{
						// Create a new view.
						var View = document.createElement("div");
						
						// Create a View navigation button.
						var NavItem = document.createElement("li");
						
						NavItem.innerHTML = MDO.Views[i].NavigationTitle;
						
						// Bind the click event to the navigation item.
						NavItem.addEventListener("click",function(e){
						
							// Get the target.
							var target = e.target || e.srcElement;
							
							// Get the index.
							var Index = _GetElementIndex(target);
							
							// Change the view.
							Interface.Modal.ChangeView(Index);
							
						},false);
						
						// Check if the view is to be displayed by default.
						if ( MDO.Views[i].DefaultView )
						{
							// Make the view active.
							View.classList.add("active");
							
							// Make the NavItem active.
							NavItem.classList.add("active");
						}
						
						// Set the View Title.
						View.innerHTML = "<h1>" + MDO.Views[i].Title + "</h1>";
						
						// Set the View body.
						View.innerHTML += MDO.Views[i].BodyHTML;
						
						// Check for view buttons.
						if ( MDO.Views[i].Buttons )
						{
							// Loop through buttons.
							for ( var j = 0; j < MDO.Views[i].Buttons.length; j++ )
							{
								// Create a new dialogue button.
								var Button = document.createElement("button"); Button.className = "dialogue";
								
								// Set the button text.
								Button.innerHTML = MDO.Views[i].Buttons[j].Title;
								
								// Bind the callback to the Button click event.
								Button.addEventListener("click",MDO.Views[i].Buttons[j].Callback,false);
								
								// Append the button to the view.
								View.appendChild(Button);
								
							}
						}
						
						// Append the Navigation item to the Navigation List.
						Navigation.appendChild(NavItem);
						
						// Append the View to the View Parent.
						Views.appendChild(View);
						
					}
					
					// Append the views to the Modal element.
					Modal.appendChild(Views);
					
					// Append the Modal to the Overlay.
					Elements.ModalOverlay.appendChild(Modal);
					
					// Display the overlay.
					Interface.Modal.ToggleVisibility();
					
					// Wait 1ms.
					setTimeout(function(){
						
						// Make the dialogue visible.
						Modal.classList.add("visible");
						
					},1);
				}
				
				// If there is only a single view..
				else
				{
					// Check for a title.
					if ( MDO.Title )
					{
						// Create an h1.
						var title = document.createElement("h1");
						
						// Set the title text.
						title.innerText = MDO.Title;
						
						// Append the title to the dialogue.
						Modal.appendChild(title);
						
					}
					
					// Check for body text.
					if ( MDO.BodyText )
					{
						// If the body text is not an array, plonk it into one.
						if ( typeof MDO.BodyText != "array" ) MDO.BodyText = [MDO.BodyText];
						
						// Loop through array elements.
						for ( var i = 0; i < MDO.BodyText[0].length; i++ )
						{
							// Create a paragraph.
							
							var p = document.createElement("p");
							
							// Set the paragraph text.
							p.innerHTML = MDO.BodyText[0][i];
							
							// Append the paragraph to the dialogue.
							Modal.appendChild(p);
							
							p = null;
							
						}
					}
					
					// Check for buttons.
					if ( MDO.Buttons )
					{
						
						// If there is only one button, then put it into an array.
						if ( typeof MDO.Buttons != "array" ) MDO.Buttons = [MDO.Buttons];
						
						// Loop through buttons.
						for ( var i = 0; i < MDO.Buttons.length; i++ )
						{
							// Create a button.
							var b = document.createElement("button");
							
							// Set the button text.
							b.innerText = MDO.Buttons[i][0].Title;
							
							b.className = "dialogue";
							
							// Check for a callback.
							if ( MDO.Buttons[i][0].Callback )
							{
								b.addEventListener("click",MDO.Buttons[i][0].Callback,false);
							}
							
							// Append the button to the modal dialogue.
							Modal.appendChild(b);
							
						}
					}
					
					// Append the Modal dialogue to the overlay.
					Elements.ModalOverlay.appendChild(Modal);
					
					// Display the overlay.
					Interface.Modal.ToggleVisibility();
					
					// Wait 1ms.
					setTimeout(function(){
						
						// Make the dialogue visible.
						Modal.classList.add("visible");
						
					},1);
					
				}
				
			}
			
			// If there's no MDO then throw an error.
			else throw("Modal Dialogue Object not sent.");
		}
		
		Interface.Modal.ChangeView = function ( index )
		{
			
			// Get Active elements in Modal.
			var actives = document.querySelectorAll("#modal .active");
			
			for ( var i = 0; i < actives.length; i++ )
			{
				actives[i].classList.remove("active");
			}
			
			var NavItems = document.querySelectorAll("#modal.usenav ol.Navigation li");
			
			NavItems[index].classList.add("active");
			
			var Views = document.querySelectorAll("#modal.usenav div.views div");
			
			Views[index - 1].classList.add("active");
		}
		
		Interface.Modal.Close = function()
		{
			// Fetch the Modal dialogue.
			var Modal = document.querySelector("#modal");
			
			// Remove the Modal dialogue.
			Modal.parentNode.removeChild(Modal);
			
			// Hide the Modal Overlay.
			Interface.Modal.ToggleVisibility();
		}
		
		/**
		 * Interface.Modal.ToggleVisibility
		 * @description Toggle Modal Overlay on or off.
		 */
		Interface.Modal.ToggleVisibility = function()
		{
			// Check if the overlay is hidden.
			if ( ! Elements.ModalOverlay.classList.contains("visible") )
			{
				// Put overlay before other elements.
				Elements.ModalOverlay.style.zIndex = 1000;
				
				// Make the overlay visible.
				Elements.ModalOverlay.className = "visible";
			}
			
			// If the overlay is not hidden..
			else
			{
				// Hide the overlay.
				Elements.ModalOverlay.className = null;
				
				// Wait for 200ms.
				setTimeout(function(){
				
					// Put overlay behind other elements.
					Elements.ModalOverlay.style.zIndex = null;
				
				},200);
			}
		}
	}
	
	/***********************************
	COLLECTION IMPLEMENTATION
   **********************************/
	
	/**
	 * Collection.Init
	 * @description Collection Initialisation.
	 */
	Collection.Init = function()
	{
		// Populate the collection.
		Collection.Populate();
		
		// Bind Collection settings handlers if CollectionSettings exists.
		if ( Elements.CollectionSettings )
		{
			// Alias Elements.CollectionSettings.ContextMenu to make the code cleaner.
			var ContextMenu = Elements.CollectionSettings.ContextMenu.Element;
			
			// Alias ContextItem.
			var ContextItem = Elements.CollectionSettings.ContextMenu.Items;
			
			// Loop through Context Menu items.
			for ( var i = 0; i < ContextItem.length; i++ )
			{
				// Bind click event to button.
				ContextItem[i].addEventListener("click",function(e){
					
					// Get the target.
					var target = e.target || e.srcElement;
					
					// Sort Options reference.
					var SortOptions = {
						"Artist > Album > Track" : ["artist","album","track"],
						"Album > Track" : ["album","track"],
						"Genre > Artist > Album > Track" : ["genre","artist","album","track"]
					};
					
					// If the sort option is already set then return. (No point in refreshing.)
					if ( SortOptions[target.innerText] == Settings.SortBy ) return;
					
					// Set the new sort option.
					Settings.SortBy = SortOptions[target.innerText];
					
					// Repopulate the collection.
					Collection.Populate();
					
					// Close the menu.
					ContextMenu.classList.remove("visible");
				
				},false);
			}
		}
	}
	
	/**
	 * Collection.Populate
	 * @description Lists the children of a collection item, or creates the top-level items if called without parameters.
	 */
	Collection.Populate = function(e)
	{
		// Get the target.
		var target = ( e && e instanceof Event ) ? e.target : Elements.Collection;

		// If the clicked item has already been populated, then toggle expansion.
		if ( target.getAttribute("data-ispopulated") == "yes" )
		{
			// Check if the element is expanded.
			if ( target.classList.contains("expanded") )
			{
				// If if is, close the list.
				target.classList.remove("expanded");
			}

			// If not, expand it.
			else target.classList.add("expanded");

			// All done.
			return true;
		}

		// If the clicked item is a track.
		else if ( target.getAttribute("data-trackid") )
		{
			// Just call Playlist.Add on it. (No need to anything more.)
			Playlist.Add(e);

			// All done.
			return true;
		}
		
		// Otherwise, populate the item.
		else
		{
			// Get the level of the item. (Level is used to indicate type, e.g. Genre, Artist, etc.)
			var Level = ( e && e instanceof Event ) ? parseInt(target.parentNode.getAttribute("data-level")) + 1 : parseInt(target.getAttribute("data-level")) ;
			
			// Set the Toplevel Name.
			Collection.TopLevelName = Settings.SortBy[0].charAt(0).toUpperCase() + Settings.SortBy[0].slice(1) + "s";
			
			// Create the Query object.
			var Query = new FormData();
			
			Query.append("query", Settings.SortBy[Level] + "s");
			
			// Set parameters required by the method.
			if ( Level > 0 )
			{
			
				// Determine the target value.
				var a = target.innerText;
				
				// Determine the parent value.
				var b = target.parentNode.parentNode.firstChild.data;
				
				// 
				if ( Settings.SortBy[Level] == "track" )
				{
					if ( a ) Query.append("b", a);
				}
				else
				{
					if ( a ) Query.append("a", a);
				}
			}
			else
			{
				// Make sure the search bar is clear when the collection is populated.
				Elements.SearchBar.value = null;
			}
			
			// Make the query.
			_XHR(Settings.Server, Query ,function(results){
				
				// If we're populating the top-level, then call Collection._CreateCollectionItems on Elements.Collection.
				if ( Level == 0 )
				{
					Collection._CreateCollectionItems(JSON.parse(results),Level,Elements.Collection,true);
				}
				// If we're populating a lower level...
				else
				{
					// Create the list items.
					var list = Collection._CreateCollectionItems(JSON.parse(results),Level,false,true);
					
					// If a list was returned...
					if ( list instanceof HTMLElement )
					{
						// Append the list to the target.
						target.appendChild(list);
						
						// Set the target populated.
						target.setAttribute("data-ispopulated","yes");
						
						// Expand the target.
						target.classList.add("expanded");
					}
					
					// Clean up.
					list = null;
				}
				
			});
		}
	}
	
	/**
	 * Collection._CreateCollectionItems
	 * @description Creates a collection from the results of a query.
	 * @param Items - The results of the query as an Object.
	 * @param Level - The level to be set for the items.
	 * @param Element - Append the items directly to an element, as opposed to having an <ol> returned.
	 * @param ContextMenu - Bind a ContextMenu to items if true.
	 */
	Collection._CreateCollectionItems = function( Items, Level, Element, ContextMenu )
	{
		try
		{
			// Check parameters are sane.
			if ( typeof Items == "object" && typeof Level == "number" )
			{
				// Define the list.
				var list = ( Element ) ? Element : document.createElement("ol");
				
				// Set the level of the item. (Level is used to indicate type, e.g. Genre, Artist, etc.)
				if ( Level !== undefined ) list.setAttribute("data-level", Level);
				
				// Check if we're populating the top-level.
				if ( Level == 0 )
				{
					// Empty the collection before adding items.
					list.innerHTML = null;
					
					// Reset the Collection Item counter.
					Collection.ItemCount = 0;
				}
				
				// Loop through the items.
				for ( var i in Items )
				{
					
					// Define generic title.
					for ( var j in Items[i]) { var title = Items[i][j] };
					
					// Check if the item is top-level.
					if ( Level == 0 )
					{
						var item = Collection._CreateListItem( title, false, true );
						
						// Increment the number of Collection items.
						Collection.ItemCount++;
					}
					
					// Check if the item is a track..
					else if ( Level == (Settings.SortBy.length - 1) )
					{
						// Define the track title.
						title = Items[i].Title;
						
						// Set the list track class.
						list.setAttribute("class","tracks");
						
						// Define the track id.
						trackid = Items[i].ID;
						
						var item = Collection._CreateListItem( title, trackid );
					}
					
					// Otherwise, the item is generic.
					else
					{
						var item = Collection._CreateListItem( title );
					}
					
					// Append the item to the list.
					list.appendChild(item);
				}
				
				// If the list is top-level...
				if ( Level == 0 )
				{
					// Set the Collection info.
					Elements.ContentInfo.Collection.innerHTML = Collection.ItemCount + ' ' + Collection.TopLevelName;
				}
				
				// If passed an element, return true, otherwise, return the list of items.
				return ( Element ) ? true : list;
				
			}
			
			// If passed incorrect parameters, throw an error.
			else throw("Passed incorrect parameters.");
		
		}
		catch(ex)
		{
			if ( window.console ) console.log("Collection._CreateCollectionItems: " + ex);
		}
	}
	
	/**
	 * Collection._CreateListItem
	 * @description Creates a list item from arguments and returns it.
	 */
	Collection._CreateListItem = function ( text, trackid, toplevel )
	{
		// Create the item.
		var item = document.createElement("li");
		
		// Make the item draggable if draggable parameter is true.
		if ( Settings.UseDragAndDrop )
		{
			// Make the item draggable.
			item.setAttribute("draggable","true");
			
			// Bind a dragstart event.
			item.addEventListener("dragstart",function(e){
				
				// Enable dragging.
				e.dataTransfer.effectAllowed = 'copy';
				
				// Get the target.
				var target = e.target || e.srcElement;
				
				// Create a Playlist Object.
				var PlaylistObject = JSON.stringify({
					level : target.parentNode.getAttribute("data-level"),
					params: {
						a : target.firstChild.data,
						b : target.parentNode.parentNode.firstChild.data,
						trackid : target.getAttribute("data-trackid")
					}
				});
				
				// Set empty payload. (Using event_buffer to capture the event, so the data is useless.)
				e.dataTransfer.setData("Text", PlaylistObject);
				
				// Create a new ghost image.
				var DragImage = new Image();
				
				// Set the source to be a 1x1px transparent png.
				DragImage.src = "images/dnd.svg";
				
				// Set the ghost image.
				e.dataTransfer.setDragImage(DragImage,22,-20);
				
			},false);
		}
		
		// Set the text.
		item.innerHTML = text;
			
		// Check if the item is a track.
		if ( trackid )
		{
			// Set the track ID.
			item.setAttribute( "data-trackid", trackid );
			
		}
			
		// Check if we're constructing a top-level item.
		if ( toplevel )
		{
			// Bind Collection.Populate to item click if we're populating the top level.
			item.addEventListener("click",Collection.Populate,false);
			
			// If ContextMenu exists...
			if ( Interface.ContextMenu )
			{
				// Bind a context menu.
				item.addEventListener("contextmenu",function(e){
					
					Interface.EventBuffer = e;
					
					var target = e.target || e.srcElement;
						
					var level = parseInt(target.parentNode.getAttribute("data-level"));
					
					// Context Menu titles.
					var titles = {
						genre : "Add Genre to Playlist.",
						artist : "Add Artist to Playlist.",
						album : "Add Album to the Playlist.",
						track : "Add Track to Playlist."
					};
						
					// Draw a custom context menu.
					Interface.ContextMenu.Create({
						x : e.x,
						y : e.y,
						items : {
							add_to_playlist : {
								name : titles[Settings.SortBy[level]],
								callback : function(){
										
									// Add the item to the playlist.
									Playlist.Add(Interface.EventBuffer);
									
									// Flush the buffer.
									Interface.EventBuffer = null;
								}
							}
						}
					});
						
				},false);
			}
		
		}
		
		// Return the constructed item.
		return item;
	}
	
	/**
	 * Collection.SettingsToggle
	 * @description Function to toggle Collection context menu.
	 */
	Collection.SettingsToggle = function()
	{
		if ( Elements.CollectionSettings )
		{
			// Toggle the menu.
			if ( Elements.CollectionSettings.ContextMenu.Element.classList.contains("visible") )
			{
				// Off.
				Elements.CollectionSettings.ContextMenu.Element.classList.remove("visible");
			}
			else {
				// On.
				Elements.CollectionSettings.ContextMenu.Element.classList.add("visible");
			}
		}
	}
	
	/***********************************
	PLAYLIST IMPLEMENTATION
   **********************************/

	/**
	 * Playlist.Init
	 * @description Initialise DnD events for the playlist.
	 */
	Playlist.Init = function()
	{
		// Check for DnD support.
		if ( Settings.UseDragAndDrop )
		{
			// Bind dragover.
			Elements.Playlist.addEventListener("dragover",function(e){
				
				// Stop browser from doing its default. (Which will break this.)
				e.preventDefault();
				
				// Add the dragover style to the element.
				this.parentNode.parentNode.classList.add("dragover");
				
				// Enable all drop effects.
				e.dataTransfer.dropEffect = "copy";
				
				
			},false);
			
			// Bind dragleave.
			Elements.Playlist.addEventListener("dragleave",function(e){
				
				// Remove dragover class.
				this.parentNode.parentNode.classList.remove("dragover");
				
			},false);
			
			// Bind drop.
			Elements.Playlist.addEventListener("drop",function(e){
			
				// Get the PlaylistObject from the drop data.
				var PlaylistObject = JSON.parse(e.dataTransfer.getData("Text"));
				
				// Send the PlaylistObject to Playlist.Add.
				Playlist.Add(PlaylistObject);
				
				// Remove dragover class.
				this.parentNode.parentNode.classList.remove("dragover");
				
			},false);
			
		}
	}

	/**
	 * Playlist.Add
	 * @description Add item(s) to the playlist.
	 * @param PlaylistObject - PlaylistObject or Event.
	 */
	Playlist.Add = function(PlaylistObject)
	{
		// Check if we're using an event.
		if ( PlaylistObject instanceof Event )
		{
			// Get the target.
			var target = PlaylistObject.target || PlaylistObject.srcElement;
			
			// Get the level.
			var Level = target.parentNode.getAttribute("data-level");
			
			// Get Parameters.
			var params = {
				a: target.firstChild.data,
				b: target.parentNode.parentNode.firstChild.data,
				trackid: target.getAttribute("data-trackid")
			}
		}
		else
		{
			// Get the level.
			var Level = PlaylistObject.level;
			
			// Get Parameters.
			var params = PlaylistObject.params;
		}
		
		var Query = new FormData();
		
		Query.append("query","track");
		
		if ( params.trackid )
		{
			Query.append("a", params.trackid);
		}
		else if ( Settings.SortBy[Level] == "artist" )
		{
			Query.append("a", params.a);
		}
		else if ( Settings.SortBy[Level] == "album" )
		{
			Query.append("b", params.a);
		}
		else if ( Settings.SortBy[Level] == "genre" )
		{
			Query.append("a", "G:" + params.a);
		}
		
		_XHR(Settings.Server, Query, function(results){
			
			// Parse the results.
			var results = JSON.parse(results);
			
			// If there is only one result, put it into an array.
			if ( ! (results instanceof Array) ) results = [results];
			
			// Loop through the results.
			for ( var i in results )
			{
				// Create playlist row.
				var row_parent = document.createElement("li"), row = document.createElement("ol");
				
				// Create a new QueueItem.
				Playlist.Queue.push({
					ID: results[i].ID,
					Title : results[i].Title,
					Artist : results[i].Artist,
					Album: results[i].Album,
					Length : results[i].Length
				});
				
				// Create playlist columns.
				for ( var j in results[i] )
				{
					var column = document.createElement("li");
					
					if ( j == "ID" )
					{
						column.className = "Index";
						column.innerHTML = (parseInt(i) + 1); // BETTER SOLUTION NEEDED.
					}
					else
					{
						column.className = j;
					
						column.innerHTML = results[i][j];
					}
					
					// Append the column to the row.
					row.appendChild(column);
				}
				
				// Bind click event.
				row.addEventListener("click",function(e){
					
					// If there is no Ctrl key being pressed...
					if ( ! e.ctrlKey && ! e.shiftKey && ! e.metaKey )
					{
						// Get all selected elements.
						var selected = document.querySelectorAll("#playlist .selected_playlist_item");
						
						// Loop through selected elements.
						for ( var i = 0; i < selected.length; i++ )
						{
							// Remove selected class.
							selected[i].classList.remove("selected_playlist_item");
						}
						
					}
					
					// If we're doing multiple select.
					if ( e.shiftKey )
					{
						// Determine the element from which we are selecting elements.
						var from = document.querySelector(".selected_playlist_item").parentNode;
						
						// Define an endpoint.
						var to = this.parentNode;
						
						// Determine the direction of the loop.
						var direction = ( _GetElementIndex(from) > _GetElementIndex(to) ) ? "up" : "down";
						
						// Make sure there was already an element selected, or this won't work.
						if ( from instanceof HTMLElement )
						{
							while ( from !== to )
							{
								// Increment from in the correct direction.
								from = ( direction == "down" ) ? from.nextSibling : from.previousSibling;
								
								// Select the current item.
								from.firstChild.classList.add("selected_playlist_item");
								
							}
						}
					}
					
					// Get the target.
					var target = e.target || e.srcElement;
					
					// Prevent click from overflowing into the parent element.
					if ( target.parentNode !== Elements.Playlist)
					{
						target.parentNode.classList.add("selected_playlist_item");
					}
					
				},false);
				
				// Bind double click event to the row_parent.
				row.addEventListener("dblclick",function(e){
					
					var index = _GetElementIndex(e.target.parentNode.parentNode);
					
					Playlist.Next(index + 1);
					
				},false);
				
				// Bind contextmenu.
				row.addEventListener("contextmenu",function(e){
					
					// Put the actual target in the buffer.
					Interface.ElementBuffer = e.target.parentNode.parentNode;
					
					// Draw a custom context menu.
					Interface.ContextMenu.Create({
						x : e.x,
						y : e.y,
						items : {
							remove_from_playlist : {
								name : "Remove from playlist.",
								callback : function(e){
															
									// Remove the selected playlist items.
									Playlist.RemoveItems();
								}
							}
						}
					});
					
					e.preventDefault();
					
				},false);
				
				// Append the row to the row parent.
				row_parent.appendChild(row);
				
				// Append the row_parent to the playlist.
				Elements.Playlist.appendChild(row_parent);
				
				// Unset row_parent.
				row = row_parent = null;
				
				// Increment the ItemCount.
				Playlist.ItemCount++;
				
				// Add the length of the track in seconds to the playlist duration.
				Playlist.Duration += parseInt(results[i].Length.split(":")[0] * 60);
				Playlist.Duration += parseInt(results[i].Length.split(":")[1]);
			}
			
			// Update the number of items in the playlist.
			var duration = _FormatDuration(Playlist.Duration);
			
			// "Track" or "Tracks"
			var prefix = ( Playlist.ItemCount > 1 ) ? " Tracks." : " Track.";
			
			// Update the playlist status bar.
			Elements.ContentInfo.Playlist.innerHTML = Playlist.ItemCount + prefix + " ( " + duration + " )";
			
		});
		
	}
	
	/**
	 * Playlist.RemoveSelectedItems
	 * @description Function to remove all selected playlist items.
	 */
	Playlist.RemoveItems = function ( e )
	{
		if ( document.querySelectorAll(".selected_playlist_item").length !== 0 )
		{
			// Get selected playlist items.
			var selected = document.querySelectorAll("#playlist .selected_playlist_item");
			
			// Loop through the playlist items.
			for ( var i = 0; i < selected.length; i++ )
			{
				var item = selected[i].parentNode;
				
				Playlist.Queue.splice(_GetElementIndex(selected[i].parentNode),1);
				
				// Remove the item.
				item.parentNode.removeChild(item);
			}
		}
		
		else
		{
			// Get the index of the playlist item.
			var Index = _GetElementIndex(Interface.ElementBuffer);
			
			// Remove element.
			Interface.ElementBuffer.parentNode.removeChild(Interface.ElementBuffer);
			
			// Remove Queue item.
			Playlist.Queue.splice(Index,1);
		}
	}
	
	/**
	 * Playlist.PlayPause
	 * @description Play/Pause toggle.
	 */
	Playlist.PlayPause = function()
	{
		
		// If a track is not playing...
		if ( Elements.Buttons.PlayPause.classList.contains("play") )
		{
			// Check if there was a track playing.
			if ( Playlist.Player.currentTime !== 0 && Playlist.Player.currentSrc !== undefined )
			{
				// Play the track.
				Playlist.Player.play();
				
				// Add The pause class.
				Elements.Buttons.PlayPause.classList.add("pause");
				
				// Remove the play class.
				Elements.Buttons.PlayPause.classList.remove("play");
			}
			
			// If there was no track paused, then play the queue.
			else Playlist.Next();
		}
		
		// If a track is playing, then pause it.
		else
		{
			// Pause the playing track.
			Playlist.Player.pause();
			
			// Remove the pause class.
			Elements.Buttons.PlayPause.classList.remove("pause");
			
			// Add The play class.
			Elements.Buttons.PlayPause.classList.add("play");
		}
		
	}
	
	/**
	 * Playlist.Stop
	 * @description Stop playing the current track and clear the queue index.
	 */
	Playlist.Stop = function()
	{
		// Pause the current track.
		Playlist.Player.pause();
		
		// Unset the track.
		Playlist.Player.currentSrc = null;
		
		Elements.TrackInfo.classList.remove("playing");
		
		Elements.Buttons.PlayPause.classList.remove("pause");
		
		Elements.Buttons.PlayPause.classList.add("play");
		
		var playlist_playing = document.querySelector("#playlist .playing");
		
		playlist_playing.classList.remove("playing");
		
	}
		
	/**
	 * Playlist.Next
	 * @description Start playing the items in the playlist.
	 */
	Playlist.Next = function( index )
	{
		// Put the range position back to zero.
		Elements.Ranges.Track.value = 0;
		
		// Check for a specific index request. (And that it is valid.)
		if ( index !== null && Playlist.Queue[index - 1])
		{
		
			// Set the index.
			Playlist.Index = (index - 1);
	
		}
		
		console.log(Playlist.Index);
		
		// Check if the index exists in the queue
		if ( Playlist.Queue[Playlist.Index] )
		{
				
			// Set the next song.
			Playlist.Player.src = Settings.Server + "?stream=" + Playlist.Queue[Playlist.Index].ID;
			
			if ( Playlist.Player.canPlayType("audio/mpeg") )
			{
				// Play the song.
				Playlist.Player.play();
				
				// Check the play button is sane.
				if ( Elements.Buttons.PlayPause.classList.contains("play") )
				{
					Elements.Buttons.PlayPause.classList.remove("play");
					Elements.Buttons.PlayPause.classList.add("pause");
				}
				
				// Remove the playing class from the last played track.
				if ( document.querySelector("ol.playing") )
				{
					document.querySelector("ol.playing").classList.remove("playing");
				}
				
				// Get the playlist item for the current track.
				var current_item = document.querySelector("#playlist ol.playlist_items > li:nth-of-type(" + (Playlist.Index + 1) + ")");				
				
				// Find the table item corresponding to the playing track.
				current_item.firstChild.classList.add("playing");
				
				// Increment the Index.
				Playlist.Index++;
				
				// Set the current queue item length in seconds.
				Playlist.CurrentQueueItemLength = _UnformatTime(Playlist.Queue[Playlist.Index -1].Length);
				
				/**
				 * Show the track info above the controls.
				 */
				var rows = current_item.getElementsByTagName("li");
				
				// Set the Title.
				Elements.PlayingInfo.Title.innerHTML = Playlist.Queue[Playlist.Index - 1].Title;
				
				// Set the Artist.
				Elements.PlayingInfo.Artist.innerHTML = Playlist.Queue[Playlist.Index - 1].Artist;
				
				// Set the Album.
				Elements.PlayingInfo.Album.innerHTML = Playlist.Queue[Playlist.Index - 1].Album;
				
				// Unhide the playing info.
				if ( ! Elements.TrackInfo.classList.contains("playing") )
				{
					Elements.TrackInfo.classList.add("playing");
				}
			}
			else
			{
				if ( Interface.Modal )
				{
					Interface.Modal.Create({
						Views: [{
						Title: "Audio Format Unsupported.",
						BodyHTML : "<p>This browser does not support playing MP3 files, please consider downloading the latest version of <a href='http://www.google.com/chrome'>Google Chrome</a> in order to fully appreciate MusicMe. MusicMe presently only supports Google Chrome, but Safari is also quite well supported.</p><p>Other browsers may be supported in the future, but for now MusicMe is in very early development and only Webkit-based browsers are supported.</p><p>Note: If you're using Chromium, whilst MusicMe is supported in Chrome, Chromium does not have the necessary codecs needed to play MP3 files, as such, moving to Chrome is suggested.",
						Type: "Close",
						Error: true
					}]
					});
				}
			}
		}
			
		// If there is no next track, or the requested
		// Queue item does not exist, then call Stop.
		else Playlist.Stop();
			
	}
		
	/**
	 * Playlist.Prev
	 * @description Go to the previous track.
	 */
	Playlist.Prev = function()
	{
		// Check that there is a previous item in the playlist.
		if ( Playlist.Queue[Playlist.Index - 2] )
		{
			// Play the previous item.
			Playlist.Next(Playlist.Index -1);
		}
	}
		
	/**
	 * Playlist.Clear
	 * @description Does what it says on the tin.
	 */
	Playlist.Clear = function ( stop )
	{
		
		// If passed true, call stop.
		if ( typeof stop == "boolean" && stop ) Playlist.Stop();
		
		// Reset variables.
		Playlist.Index = 0;
		Elements.ContentInfo.Playlist.innerText = '0 Tracks. ( 0 Seconds. )';
		Playlist.ItemCount = 0;
		Playlist.Duration = 0;
		
		// Clear the queue.
		Playlist.Queue = [];
		
		// Clear the table.
		Elements.Playlist.innerHTML = null;
			
	}
	
	/**
	 * Playlist.Mute
	 * @description Mute toggle.
	 */
	Playlist.Mute = function()
	{
		// If the volume is not muted already.
		if ( Playlist.Player.volume !== 0 )
		{
			// Mute the volume.
			Playlist.Player.volume = 0;
			
			// Set the range value to zero.
			Elements.Ranges.Volume.value = 0;
			
		}
		
		// If the volume is already muted.
		else
		{
			// Set the volume to the previous value.
			Playlist.Player.volume = Settings.DefaultVolume;
			
			// Set the range to the previous value.
			Elements.Ranges.Volume.value = Settings.DefaultVolume;
		}
	}
	
	/**
	 * Playlist.Unmute
	 */
	Playlist.Unmute = function()
	{
		// Set the volume to maximum.
		Playlist.Player.volume = 1;
		
		// Set the range value to maximum.
		Elements.Ranges.Volume.value = 1;
		
		// Set the default volume setting to maximum.
		Settings.DefaultVolume = 1;
	}
	
	/***********************************
	BUTTON EVENTS
   **********************************/
	
	/** Bind Play/Pause click event. */
	if ( Elements.Buttons.PlayPause )
	{
		Elements.Buttons.PlayPause.addEventListener("click",Playlist.PlayPause,false);
	}
	
	/**  Bind Stop click event to Playlist.Stop. */
	if ( Elements.Buttons.Stop )
	{
		Elements.Buttons.Stop.addEventListener("click",Playlist.Stop,false);
	}
	
	/** Bind Next click event to Playlist.Next. */
	if ( Elements.Buttons.Next )
	{
		Elements.Buttons.Next.addEventListener("click",Playlist.Next,false);
	}
	
	/** Bind Prev click event to Playlist.Prev. */
	if ( Elements.Buttons.Prev )
	{
		Elements.Buttons.Prev.addEventListener("click",Playlist.Prev,false);
	}
	
	/** Bind Clear click event to Playlist.Clear. */
	if ( Elements.Buttons.Clear )
	{
		Elements.Buttons.Clear.addEventListener("click",Playlist.Clear,false);
	}
	
	/** Bind Mute click event. */
	if ( Elements.Buttons.Mute )
	{
		Elements.Buttons.Mute.addEventListener("click",Playlist.Mute,false);
	}
	
	/** Bind Unmute click event. */
	if ( Elements.Buttons.Unmute )
	{
		Elements.Buttons.Unmute.addEventListener("click",Playlist.Unmute,false);
	}

	/** Bind Collection Settings Button to click event. **/
	if ( Elements.CollectionSettings && Elements.CollectionSettings.Toggle )
	{
		Elements.CollectionSettings.Toggle.addEventListener("click",Collection.SettingsToggle,false);
	}
	
	/** Bind Settings button to click event. **/
	if ( Elements.Buttons.Settings )
	{
		Elements.Buttons.Settings.addEventListener("click",function(){
		
			// Create the Settings Modal Dialogue.
			Interface.Modal.Create({
				Title: "Settings",
				Class: "settings",
				Views : [
					{
						Title: "Interface Preferences",
						NavigationTitle: "Interface",
						BodyHTML: "<p>This pane will allow for configuration of the MusicMe Interface.</p>",
						DefaultView: true,
						Buttons: [
							{
								Title: "Close",
								Callback: function()
								{
									Interface.Modal.Close();
								}
							}
						]
					},
					{
						Title: "Server Key Authentication",
						NavigationTitle: "Server Keys",
						BodyHTML: "<p>This panel will allow for adding and removing token keys from the server.</p>",
						Buttons: [
							{
								Title: "Close",
								Callback: function()
								{
									Interface.Modal.Close();
								}
							}
						]
					},
					{
						Title: "Themes",
						NavigationTitle: "Themes",
						BodyHTML: "<p>Theme Support is under development. There's a lot to get through before this will be ready.</p>",
						Buttons: [
							{
								Title: "Close",
								Callback: function()
								{
									Interface.Modal.Close();
								}
							}
						]
					},
					{
						Title: "Album Art Manager",
						NavigationTitle: "Album Art",
						BodyHTML: "<p>Support for managing Album art will be added at some point.</p>",
						Buttons: [
							{
								Title: "Close",
								Callback: function()
								{
									Interface.Modal.Close();
								}
							}
						]
					}
				]
			});
			
		
		},false);
	}
	
	/** Bind Playing Info remaining toggle. **/
	if ( Elements.PlayingInfo.RemainingTime )
	{
		Elements.PlayingInfo.RemainingTime.addEventListener("click",function(){
	
			if ( Settings.PlayingInfoType == "Remaining" )
			{
			
				Settings.PlayingInfoType = "Duration";
				
				if ( Playlist.Queue[Playlist.Index -1].Length.split(":")[0].length < 2 )
				{
					var Length = "0" + Playlist.Queue[Playlist.Index -1].Length;
				}
				else
				{
					var Length = Playlist.Queue[Playlist.Index -1].Length;
				}
				
				Elements.PlayingInfo.RemainingTime.innerHTML = Length;
			}
			else
			{
				Settings.PlayingInfoType = "Remaining";
			}
		
		},false);
	}
	
	/***********************************
	RANGE EVENTS
   **********************************/
	
	/** Bind volume change event. */
	Elements.Ranges.Volume.addEventListener("change",function(e){

		// Set the volume to the changed range value.
		Playlist.Player.volume = Number(e.target.value).toFixed(1);

		// Set the default value to the changed range value.
		Settings.DefaultVolume = Playlist.Player.volume;

	},false);
	
	/** Bind track change event. (Seek event.) */
	Elements.Ranges.Track.addEventListener("change",function(e){
	
		// Check if the track source is ready.
		if ( Playlist.Player.readyState === 4 )
		{
			// Seek to range position.
			Playlist.Player.currentTime = e.target.value;
		}
		
		// If the track source is not ready.
		else
		{
			// Set the range value to the player position.
			Elements.Ranges.Track.value = Playlist.Player.currentTime;
		}
	
	},false);
	
	/** Bind Player duration change. (For when the track is changed and has a different length.) */
	Playlist.Player.addEventListener("durationchange",function(){
		
		// Set the Audio range maximum value for the new track.
		Elements.Ranges.Track.setAttribute("max", _UnformatTime(Playlist.Queue[Playlist.Index -1].Length));
		
	},false);
	
	/** Bind Player timeupdate event. */
	Playlist.Player.addEventListener("timeupdate",function(){
		
		// Update the track range position.
		Elements.Ranges.Track.value = Playlist.Player.currentTime;
		
		// Get the time.
		var time = _FormatTime(parseInt(Playlist.Player.currentTime));
		
		// Set current time.
		Elements.PlayingInfo.CurrentTime.innerHTML = time[0] + ":" + time[1];
		
		// Set the remaining time.
		if ( Settings.PlayingInfoType == "Remaining" )
		{
		
			// Get the remaining time.
			var remaining = _FormatTime(Playlist.CurrentQueueItemLength - Playlist.Player.currentTime);
			
			// Set the remaining time.
			Elements.PlayingInfo.RemainingTime.innerHTML = "-" + remaining[0] + ":" + remaining[1];
		}
		
		// Simulate the 'ended' event. (Ended does not fire when Playlist.Queue[Index].Length is equal to Infinity.)
		if ( Playlist.Player.currentTime >= ( Playlist.CurrentQueueItemLength - 1 ) )
		{
			// Set the duration.
			Elements.PlayingInfo.RemainingTime.innerText = "-00:00";
			
			// Reset the current time.
			Elements.PlayingInfo.CurrentTime.innerText = "00:00";
			
			// Play the next track.
			Playlist.Next();
		}
		
	},false);
	
	/***********************************
	 SEARCH
	**********************************/
	
	Elements.SearchBar.addEventListener("keyup",function(e){
		
		// Get the search.
		var search = e.target.value || e.srcElement.value;
		
		// Backup the SortBy array.
		if ( ! Settings.SortByOriginal ) Settings.SortByOriginal = Settings.SortBy;
		
		Collection.ItemCount = 0;
		
		// Enforce an Artist > Album > Track SortBy Order.
		Settings.SortBy = ["artist","album","track"];
		
		if ( search.length == 0 )
		{
			// Put back original SortBy.
			Settings.SortBy = Settings.SortByOriginal;
			
			// Remove the SortBy Backup.
			Settings.SortByOriginal = null;
			
			// Populate the collection.
			Collection.Populate();
			
		}
		
		// Minimum query length of 2 characters.
		if ( search.length > 2)
		{
			
			// Create a Query object.
			var Query = new FormData();
			
			Query.append("search",search);
			
			// Make the query.
			var query = Settings.Server + "search=" + encodeURIComponent(search);
			
			// Make the request.
			_XHR(Settings.Server, Query, function( results )
			{
			
				results = JSON.parse(results);
				
				// Clear the collection.
				Elements.Collection.innerHTML = null;
				
				if ( results.length !== 0 )
				{
					var SearchObject = {};
					
					function Track( Title, ID )
					{
						this.Title = Title;
						
						this.ID = ID;
					}
					
					// Build a Search Object.
					for ( var i in results )
					{
						if ( ! SearchObject[results[i].Artist] )
						{
							SearchObject[results[i].Artist] = {};
						}
						
						if ( ! SearchObject[results[i].Artist][results[i].Album] )
						{
							SearchObject[results[i].Artist][results[i].Album] = [];
						}
						
						SearchObject[results[i].Artist][results[i].Album].push(new Track(results[i].Title, results[i].ID));
						
					}
					
					for ( var i in SearchObject )
					{
						var artist = Collection._CreateListItem( i );
						
						artist.setAttribute("class","expanded");
						
						var albums = document.createElement("ol");
						
						albums.setAttribute("data-level","1");
						
						for ( var j in SearchObject[i] )
						{
							var album = Collection._CreateListItem( j );
							
							album.setAttribute("class","expanded");
							
							var tracks = document.createElement("ol");
							
							tracks.setAttribute("data-level","2");
							
							tracks.setAttribute("class","tracks");
							
							for ( var k = 0; k < SearchObject[i][j].length; k++ )
							{
								var track = Collection._CreateListItem( SearchObject[i][j][k].Title, SearchObject[i][j][k].ID );
								
								tracks.appendChild(track);
								
								// Increment the number of results.
								Collection.ItemCount++;
							}
							
							album.appendChild(tracks);
							
							albums.appendChild(album);
						}
						
						artist.appendChild(albums);
						
						Elements.Collection.appendChild(artist);
						
						Elements.ContentInfo.Collection.innerHTML = Collection.ItemCount + " Search Results.";
						
					}
				}
				
				else
				{
					var NoResults = document.createElement("li");
					
					NoResults.innerHTML = "No Results Found.";
					
					Elements.ContentInfo.Collection.innerHTML = "0 Search Results";
					
					NoResults.setAttribute("class","noresults");
					
					// Clear the collection.
					Elements.Collection.appendChild(NoResults);
				}
				
			});
		}
		
	},false);

	/***********************************
	KEYBOARD SHORTCUTS
   **********************************/
	
	if ( Settings.UseKeyboardShortcuts )
	{
		
		// Bind keyup to Interface.KeyboardShortcuts.PlaylistDeleteSelected.
		Elements.Playlist.addEventListener("keyup",function(e)
		{
			// Check for the Delete Key.
			if ( e.keyCode == 46 )
			{
				Playlist.RemoveSelectedItems();
			}
			
			
		},false);
		
	}
	
	/***********************************
	DEBUG BINDINGS.
   **********************************/
	
	// Check Debug setting.
	if ( Settings.Debug == true )
	{
		// Expose objects.
		this.Settings = Settings;
		this.Playlist = Playlist;
		this.Collection = Collection;
		this.Elements = Elements;
		this.Interface = Interface;
		
		// Expose private functions.
		this._XHR = _XHR;
		this._FormatTime = _FormatTime;
		this._FormatDuration = _FormatDuration;
		this._UnformatTime = _UnformatTime;
	}
	
	/** Initialise MusicMe. **/
	this.Init();
}
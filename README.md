#MusicMe Documentation#

MusicMe is built to allow development of flexible and extensive themes, allowing the themer to design their own structure and style,
and simply create an object to wire up their theme's elements to the MusicMe class.

MusicMe accepts two parameters, both will be explained in great deal below. MusicMe can be called without instantiation, however,
if you are debugging, it will be useful to instantiate it and enable debugging in order to take a look at some of the objects
driving MusicMe.

##Usage:##

	MusicMe ( Elements, SettingsOverride )


###Elements###

The Elements object is a structure, defined by the theme developer, to wire up your elements to the MusicMe class. Some Element
definitions can be safely ignored, but others will result in MusicMe failing to start.

A minimal Elements Object could be the following:

	var Elements = {
		
		Collection : null,
		Playlist : null,
		Buttons : {
			PlayPause : null
		},
		Ranges : {
			Track : null,
			Volume : null
		}
	}

Obviously, in the above example, null will be replaced with a link to an HTMLElement, as returned by document.getElementById or
document.QuerySelector.

####SettingsOverride###

The Settings Override Object is likely to be used for defining the MusicMe server, but the following options are available to
override:

#####Server#####

Contains the URL to the MusicMe server. By default, this value is "http://127.0.0.1/", however,
this will more than likely need to be changed in order to make MusicMe functional.

#####SortBy#####

SortBy defined the order in which the music should be displayed. The setting is an array, and will accept the following options:

	[ "genre", "artist", "album", "track" ]

	[ "artist", "album", "track" ] (default)

	[ "album", "artist", "track" ]

	[ "artist", "track" ]

If Elements -> CollectionSettings is fully defined, the user will be able to switch between the above display modes.

#####UseDragAndDrop#####

Enables or disables HTML5 Drag and Drop support, either true (default) or false.

#####UseKeyboardShortcuts#####

Enables the use of Keyboard Shortcuts. The following Keyboard Shortcuts are defined:

	Up/Down arrows - Moves the playlist selection up or down.

	Space - Toggle Play/Pause.

	Del - Removes the selected playlist items.

UseKeyboardShortcuts is true by default.

#####DefaultVolume#####

Sets the volume when MusicMe is started, by default the value is 0.5, (50 percent,) and the value
can be anything between 0 (mute) and 1 (full volume.)

#####Debug#####

Debugging bool, this causes MusicMe to log any actions, (queries, clicks, drags, etc.) to the console
and also expose the following objects:

	Settings - Complete settings values.
	Playlist - Contains Queue, Indexes and Playlist Methods. (Play, Pause, Stop, etc.)
	Collection - Contains Collection methods and settings.
	Elements - Contains the passed Elements object.
	Interface - Contains any interface variables, such as the Context Menu and Modal methods.
	
And the following private methods:

	_XHR - XMLHttpRequest Function.
	_FormatTime - Format a time in seconds to 0:0 time.
	_FormatDuration - Format a duration in seconds to hours, minutes and seconds.
	_UnformatTime - Get the duration in seconds from a time formatted "00:00".

In order to access these Objects/Methods, MusicMe must be instantiated and put into a global variable:

	MM = new MusicMe ( Elements, Settings );

#####CustomInitialisation#####

Custom Initialisation function, can be used to hook plugins or extend MusicMe functionality.

Used like so:

	var SettingsOverride = {
		CustomInitialisation: function()
		{
			this.Collection.Init();
			
			this.Playlist.Init();
			
			this._XHR("http://127.0.0.1",false, function(result){
				console.log(result);
			});
			
		}
	}

In the above example, the Collection and Playlist are initialised, and _XHR is used to query 127.0.0.1,
and the results are logged to the console.
var SuperAsana = {
	/**
	 * Add the superman logo to Asana Logo
	 */
	addLogo: function() {
		var url = 'http://cdn.mysitemyway.com/etc-mysitemyway/icons/legacy-previews/icons-256/blue-jelly-icons-business/078583-blue-jelly-icon-business-logo-superman-sc37.png';
		
		Zepto('#logo').prepend('<img src="' + url + '" height="20" style="vertical-align: middle" />');
	},

	/**
	 * Initializes the SuperAsana after loaded dependencies
	 */
	init: function() {
		//Add the logo
		this.addLogo();

		//Changes the original PushState function
		//to intercept location changes
		var originalPushState = history.pushState;

		history.pushState = function() {
			originalPushState.apply(this, arguments);

			var argumentsArray = [];

			//Convert arguments object to array
			for (var i in arguments) {
				argumentsArray.push(arguments[i]);
			}

			Zepto(document).trigger('location:change', argumentsArray);
		}

		Zepto(document).on('location:change', function(e, state, title, url) {
			SuperAsana.route(url);
		});

		//Window resize redraws the page, we need to render again
		Zepto(window).on('resize', function() {
			SuperAsana.route(window.location.pathname);
		});

		//Execute the initial route based on the window location pathname
		SuperAsana.route(window.location.pathname);
	},

	/**
	 * Load the dependencies scripts
	 */
	loadScripts: function() {
		//Loads Zepto
		var zeptojs = document.createElement('script');
		zeptojs.type = 'text/javascript';
		zeptojs.src = 'https://cdnjs.cloudflare.com/ajax/libs/zepto/1.1.6/zepto.min.js';
		document.body.appendChild(zeptojs);

		var waitCounter = 0;

		//Waits for Zepto
		var zeptoInterval = setInterval(function() {
			if (Zepto) {
				clearInterval(zeptoInterval);
				//Initialize Super Asana
				SuperAsana.init();
			}

			//Greater then 10 seconds
			//Cancel the waiting, and add Zepto again
			if (waitCounter > 100) {
				clearInterval(zeptoInterval);
				SuperAsana.loadScripts();
			}

			waitCounter++;
		}, 100);		
	},

	pages: {
		taskList: {
			/**
			 * Add a project overview section box with pomodoro details
			 * @param {float}   completed  Number of completed pomodoros
			 * @param {float}   total      Total of pomodoros
			 */
			addProjectPomodoroSection: function(completed, total) {
				Zepto('.project-overview').prepend('' +
					'<div class="project-overview-section">' +
						'<div class="section-header description">POMODORO</div>' +
						'<div>' +
							'<div class="burnup-big-numbers">' +
								'<div class="tasks-completed">' +
									'<span class="task-count">' + completed + '</span>' +
									'<span class="task-count-label">Pomodoros Completed</span>' +
								'</div>' +
								'<div class="tasks-remaining">' +
									'<span class="task-count">' + total + '</span>' +
									'<span class="task-count-label">Pomodoros Total</span>' +
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'');
			},

			/**
			 * Initializes the page
			 */
			init: function() {
				//Find all tasks
				var tasks = Zepto('.task-row'),
					//The task has a Pomodoro text? Check for the pattern:
					//[ 1 / 1 ] - Task name
					//[ 1 / x ] - Task name
					//[ 1.5 / x ] - Task name
					pomodoroRegex = /\[(\s*\d*\s*)\/(\s*(\d*|x)\s*)\](\s*)-(\s*)(.*)/,
					//Number of pomodoros completed
					completed = 0,
					//Total of pomodoros
					total = 0;

				tasks.each(function() {
					var textarea = Zepto(this).find('textarea'),
						matchResult = textarea.val().match(pomodoroRegex);

					//If it's a pomodoro task, sum the pomodoros values
					if (matchResult) {
						completed += parseFloat(matchResult[1]);

						if (matchResult[2].trim() != 'x') {
							total += parseFloat(matchResult[2]);
						}
					}
				});

				this.addProjectPomodoroSection(completed, total);
			}
		}
	},

	/**
	 * Initializes the correct page for the current url
	 * @param  {string} url Window pathname
	 */
	route: function(url) {
		// Tasks List URL => '/0/1234567890123/list'
		var listRegex = /\/0\/([0-9]*)\/list/;

		if (listRegex.test(url)) {
			SuperAsana.pages.taskList.init();
		}
	},
}

SuperAsana.loadScripts();
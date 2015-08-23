var SuperAsana = {
	/**
	 * Add the superman logo to Asana Logo
	 */
	addLogo: function() {
		var url = SuperAsana.Images.logo;
		
		Zepto('#logo').prepend('<img src="' + url + '" height="20" style="vertical-align: middle" />');
	},

	Images: {
		logo: 'http://cdn.mysitemyway.com/etc-mysitemyway/icons/legacy-previews/icons-256/blue-jelly-icons-business/078583-blue-jelly-icon-business-logo-superman-sc37.png',
		tomato: 'http://www.veryicon.com/icon/16/Food%20%26%20Drinks/Vegetables/Tomato.png'
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

	Pages: {
		/**
		 * The details page of a task
		 */
		TaskDetails: {
			addPomodoroCounterButton: function() {
				var iconUrl = SuperAsana.Images.tomato,
					self = this;

				Zepto('.property.description.taskDetailsView-description').after('' +
					'<div class="property super" style="padding-bottom: 10px; padding-left: 15px;">' +
						'<span class="super pomodoro button start" style="' +
							'background: url(' + iconUrl + ') no-repeat 2px 3px;' +
							'background-size: 12px;' +
							'cursor: pointer;' +
							'display: inline-block;' +
							'padding-left: 20px;' +
							'visibility: visible;' +
						'">START</span>' +
					'</div>' +
				'');

				Zepto('.super.pomodoro.button').on('click', function(e) {
					SuperAsana.Pomodoro.startForTask(self.getCurrentProjectId(), self.getCurrentTaskId());
				});
			},

			getCurrentProjectId: function() {
				var pathnameSplit = window.location.pathname.split('/');

				return pathnameSplit[pathnameSplit.length - 2];
			},

			getCurrentTaskId: function() {
				var pathnameSplit = window.location.pathname.split('/');

				return pathnameSplit[pathnameSplit.length - 1];
			},

			/**
			 * Initializes the page
			 */
			init: function() {
				var superDiv = Zepto('.details-pane-body .property.super');

				if (superDiv.length == 0) {
					this.addPomodoroCounterButton();
				}
			}
		},

		/**
		 * The project page, listing all the tasks
		 */
		TaskList: {
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
					//[ x / 1 ] - Task name
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
						if (matchResult[1].trim() != 'x') {
							completed += parseFloat(matchResult[1]);
						}

						if (matchResult[2].trim() != 'x') {
							total += parseFloat(matchResult[2]);
						}
					}
				});

				this.addProjectPomodoroSection(completed, total);
				this.markRunningTasks();
			},

			/**
			 * Add a mark to the running task on the task list
			 */
			markRunningTasks: function() {
				var iconUrl = SuperAsana.Images.tomato,
					self = this;

				//The pomodoro is running?
				if (SuperAsana.Pomodoro.current.taskId && SuperAsana.Pomodoro.current.projectId) {
					var taskTextAreaId = '#pot.' + SuperAsana.Pomodoro.current.projectId + '_row__main_input__SPECIAL_GROUP_NULL_' +
						SuperAsana.Pomodoro.current.taskId,
						textarea = Zepto(taskTextAreaId);
					
					//The textarea exists?
					if (textarea.length == 1) {
						var tr = textarea.closest('tr');

						//The task is not marked?
						if (tr.find('.super.pomodoro-mark').length == 0) {
							tr.find('.grid-cell.grid_cell_assignee').append('' +
								'<span class="super pomodoro-mark">' +
									'<img src="' + iconUrl + '" width="20" />' +
								'</span>' +
							'');
						}
					}
				}
			}
		}
	},

	Pomodoro: {
		current: {
			projectId: null,
			running: false,
			startedAt: 0,
			taskId: null,
		},

		//The second interval for pomodoro counting
		interval: null,

		addPomodoroPanel: function() {
			Zepto('#header').after('' +
				'<div id="super-pomodoro-panel" style="padding: 10px; text-align: center;">' +
					'<h1 class="clock">00:00:00</h1>' +
				'</div>' +
			'');
		},

		/**
		 * Start a Pomodoro
		 */
		start: function() {
			var self = this;

			if (! this.current.running) {
				//Call the tick function, the "this" will be the Pomodoro
				this.interval = setInterval(function() {
					self.tick.call(self);
				}, 1000);

				this.current.startedAt = new Date().getTime();
			}
		},

		/**
		 * Start a Pomodoro for a Task
		 * @param  {int} projectId 	The Project ID
		 * @param  {int} taskId 	The Task ID
		 */
		startForTask: function(projectId, taskId) {
			var pomodoroPanel = Zepto('#super-pomodoro-panel');

			if (pomodoroPanel.length == 0) {
				this.addPomodoroPanel();
			}

			this.projectId = projectId;
			this.taskId = taskId;

			this.start();

			//Mark the task on the list
			SuperAsana.Pages.TaskList.markRunningTasks();
		},

		/**
		 * A clock tick
		 */
		tick: function() {
			var now = new Date().getTime(),
				//In seconds
				totalTime = Math.floor((now - this.current.startedAt) / 1000),
				hours = 0,
				minutes = 0,
				seconds = 0;

			//We have hours!
			if (totalTime > 3600) {
				hours = Math.floor(totalTime / 3600);
				totalTime -= (hours * 3600);
			}

			//We have minutes!
			if (totalTime > 60) {
				minutes = Math.floor(totalTime / 60);
				totalTime -= (minutes * 60);
			}

			seconds = totalTime;

			this.updateClock(hours, minutes, seconds);
		},

		/**
		 * Update the clock from Pomodoro Panel
		 * @param  {int} hours   Hours
		 * @param  {int} minutes Minutes
		 * @param  {int} seconds Seconds
		 */
		updateClock: function(hours, minutes, seconds) {
			var clock = Zepto('#super-pomodoro-panel .clock');

			//Format the time
			if (hours < 10) {
				hours = '0' + hours;
			}

			if (minutes < 10) {
				minutes = '0' + minutes;
			}

			if (seconds < 10) {
				seconds = '0' + seconds;
			}

			clock.html(hours + ':' + minutes + ':' + seconds);
		}
	},

	/**
	 * Initializes the correct page for the current url
	 * @param  {string} url Window pathname
	 */
	route: function(url) {
		// Tasks List URL => '/0/1234567890123/list'
		var listRegex = /\/0\/([0-9]*)\/list/,
			//Task Details URL => '/0/1234567890123/1234567890123'
			detailsRegex = /\/0\/([0-9]*)\/([0-9]*)/;

		if (listRegex.test(url)) {
			SuperAsana.Pages.TaskList.init();
		} else if (detailsRegex.test(url)) {
			SuperAsana.Pages.TaskDetails.init();
		}
	},

	User: {
		/**
		 * Get the current user id
		 * @return {int} Current user id
		 */
		getId: function() {
			//Found on Asana source code - Thank you Asana Team S2
			return window.env.user().global_id;
		}
	}
}

SuperAsana.loadScripts();
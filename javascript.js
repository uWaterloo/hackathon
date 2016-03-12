angular.module('portalApp')

.controller('hackathonCtrl', ['$scope', '$http', '$q', 'hackathonFactory', 'alertService', function ($scope, $http, $q, hackathonFactory, alertService) {
	
    // make service available to scope so we can call it directly from the view
    $scope.hackathonFactory = hackathonFactory;

    // Main view

    $scope.ideas = hackathonFactory.ideas;  // list of ideas
    $scope.idea = hackathonFactory.idea;    // currently selected idea (details view)

    // Submit idea controls

    $scope.newIdea = hackathonFactory.newIdea;
    $scope.submitted = hackathonFactory.submitted;
    $scope.submitting = hackathonFactory.submitting;
    $scope.isCollapsed = { value: true };

    // Submit feed back controls

    $scope.newFeedback = hackathonFactory.newFeedback;
    $scope.submittedFeedback = hackathonFactory.submittedFeedback;
    $scope.submittingFeedback = hackathonFactory.submittingFeedback;
    $scope.feedbackCategory = hackathonFactory.feedbackCategory;
    $scope.isFeedbackCollapsed = { value: true };
    
    // Show loading screen and begin fetching the list of ideas

    $scope.portalHelpers.toggleLoading(true);
    $scope.portalHelpers.showView('loading.html', 1);

	hackathonFactory.init($scope).then(function () {
	    $scope.portalHelpers.showView('main.html', 1);
	    $scope.portalHelpers.toggleLoading(false);
	});

    // Handle ^ button click
	$scope.up = function (idea) {
	    if (idea.voted)
	        return;

	    idea.voted = true;
	    idea.upCount++;

	    $scope.portalHelpers.invokeServerFunction('up', { id: idea.id }).then(function (result) {
	        if (result != "true")
	            voteFail(idea);
	    }, function (fail) {
	        voteFail(idea);
	    });
	};

    // Handle failure to upvoat
	function voteFail(idea) {
	    alertService.alert('Could not count your vote, please try again', 'danger');
	    idea.voted = false;
	    idea.upCount--;
	};

    // Handle click on an item in the list and search example
	$scope.showDetailsView = function (idea) {
        // Set which item to show in the details view
        $scope.idea.value = idea;
        // Show details view in the second column
        $scope.portalHelpers.showView('details.html', 2);
    };

    // Handle "previous item" click from the details page
    $scope.prevItem = function () {
        // get previous items in the list
        var prevItem = $scope.portalHelpers.getPrevListItem();
        // refresh details view with the new item
        $scope.showDetailsView(prevItem);
    }

    $scope.nextItem = function () {
        var nextItem = $scope.portalHelpers.getNextListItem();
        $scope.showDetailsView(nextItem);
    }

}])

    // Controller for the nowlet (dashboard component)
    .controller('hackathonNowCtrl', ['$scope', '$http', '$q', 'hackathonFactory', '$rootScope', function ($scope, $http, $q, hackathonFactory, $rootScope) {
        $scope.hackathonFactory = hackathonFactory;
        $scope.$emit('showNowlet', 'hackathon');
        $rootScope.$broadcast('widgetReady', 'hackathon');
        $scope.loading = true;
        $scope.daysLeft = hackathonFactory.daysLeft;
        $scope.date = hackathonFactory.date;
        $scope.newIdea = hackathonFactory.newIdea;
        $scope.submitted = hackathonFactory.submitted;
        $scope.submitting = hackathonFactory.submitting;

        var r = hackathonFactory.getDate($scope);
        r.then(function (succ) {
            $scope.loading = false;
        });

        $scope.dismissNowlet = function () {
            if (confirm("To re-enable use the configure section of the dashboard. Proceed?")) {
                $scope.$emit('hideNowlet', 'hackathon');
                $scope.$emit('masonry.reload');
                var nowlet = Enumerable.From($rootScope.settings.userNowlets).Where(function (x) { return x.UniqueNameId == 'hackathon'; }).SingleOrDefault();
                nowlet.show = false;

                $http.post('/Widget/UnsubscribeFromNowlet', { uniqueId: 'hackathon' }).then(function (res) {
                });
            }
        };

    }])
    // Factory maintains the state of the widget
    .factory('hackathonFactory', ['$http', '$rootScope', '$filter', '$q', function ($http, $rootScope, $filter, $q) {
        var initialized = {
            value: false
        };

        var gotDate = { value: false };
        var daysLeft = { value: null };
        var date = { value: null };
        var newIdea = { value: "" };
        var submitting = { value: false };
        var submitted = { value: false };

        var newFeedback = { value: "" };
        var submittedFeedback = { value: false };
        var submittingFeedback = { value: false };
        var feedbackCategory = {value:'other'};

        var ideas = { value: [] };
        var idea = { value: null };
        var scope;

        var init = function ($scope) {
            var deferred = $q.defer();

            scope = $scope;
            if (initialized.value)
                deferred.resolve();
            else {
                initialized.value = true;

                $scope.portalHelpers.invokeServerFunction('getData').then(function (result) {
                    ideas.value = result;
                    deferred.resolve();
                }, function (fail) {
                    deferred.resolve();
                });
            }

            return deferred.promise;
        }

        // Get when the hackathon is happenning
        var getDate = function ($scope) {
            scope = $scope;
            var deferred = $q.defer();

            if (gotDate.value) {
                deferred.resolve();
            } else {
                $scope.portalHelpers.invokeServerFunction('hackathonDateData').then(function (result) {
                    daysLeft.value = result.daysRemaining;
                    date.value = moment(result.date).toDate();
                    deferred.resolve();
                    gotDate.value = true;
                });
            }

            return deferred.promise;
        }

        // Submit an idea
        var submitIdea = function () {
            submitting.value = true;
            scope.portalHelpers.invokeServerFunction('addIdea', { description: newIdea.value }).then(function (result) {
                newIdea.value = "";
                submitting.value = false;
                submitted.value = true;
            });
        }

        // Submit feedback
        var submitFeedback = function () {
            submittingFeedback.value = true;
            scope.portalHelpers.invokeServerFunction('addFeedback', { feedback: newFeedback.value, category: feedbackCategory.value }).then(function (result) {
                newFeedback.value = "";
                submittingFeedback.value = false;
                submittedFeedback.value = true;
            });
        }

        return {
            init: init,
            daysLeft: daysLeft,
            date: date,
            getDate: getDate,
            submitIdea: submitIdea,
            submitted: submitted,
            newIdea:newIdea,
            submitting: submitting,
            ideas: ideas,
            idea: idea,
            submitFeedback: submitFeedback,
            newFeedback :newFeedback,
            submittedFeedback :submittedFeedback,
            submittingFeedback: submittingFeedback,
            feedbackCategory: feedbackCategory
        };

    }]);
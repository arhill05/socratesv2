'use strict';

angular.module('angularfireApp')
  .controller('QuestionsCtrl', function($scope, Ref, $firebaseArray,
    $firebaseAuth, $timeout, $routeParams, Auth, User, currentAuth) {
      $scope.isAdmin = false;
        $scope.session = $routeParams.sessionID;
    $scope.questions = $firebaseArray(Ref.child('sessions/' + $routeParams.sessionID +
      '/Questions'));
    Ref.child('sessions').orderByKey().equalTo($routeParams.sessionID).on(
      "child_added",
      function(snapshot) {
        $scope.currentSession = snapshot.val();
        $scope.pinNumber = $scope.currentSession.pinNumber;
        $scope.adminUser = $scope.currentSession.adminUser;
      });
    // display any errors
    $scope.questions.$loaded().catch(alert);
    $scope.auth = currentAuth;
    $scope.checkAdmin = function() {
      if ($scope.adminUser == $scope.user)
        $scope.isAdmin = true;
      else
        $scope.isAdmin = false;

      console.log($scope.isAdmin);
    }


    $scope.userPath = Ref.child('Users');


    $scope.userPath.orderByChild('uid').equalTo($scope.auth.uid).on(
      "child_added",
      function(snapshot) {
        $scope.user = snapshot.key();
        $scope.username = snapshot.val().email;
        $scope.checkAdmin();
        var userQuestionsPath = Ref.child('Users/' + $scope.user).child(
          'upvotedQuestions');
        $scope.userQuestions = User.getUserQuestions($scope.auth.uid) 
        $scope.userQuestions.$loaded().then(function(userQuestions) {
          console.log(userQuestions.length);
          userQuestionsPath.once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              var questionKey = childSnapshot.key();
              var a = 0;
              for (var a; a < $scope.questions.length; a++) {
                if ($scope.questions[a].$id == questionKey) {
                  $('#' + $scope.questions[a].$id).css('color',
                    'blue');
                  $('#' + $scope.questions[a].$id).css(
                    'font-weight', 'bolder');
                  $('#' + $scope.questions[a].$id).css(
                    'font-size', '125%');
                }
              }
            })
          })
        });

      });

    // provide a method for adding a question
    $scope.addQuestion = function() {
      var question = {
        text: $scope.text,
        upvotes: 0,
        disabled: false
      };
      $scope.questions.$add(question);
      $scope.text = '';
    };

    // provide method for upvoting questions
    $scope.upvoteQuestion = function(question) {
      var key = $scope.questions.$indexFor(question.$id);
      $scope.newQuestion = true;

      if ($scope.userQuestions.length == 0) {
        question.upvotes = question.upvotes + 1;
        $('#' + question.$id).css('color', 'blue');
        $('#' + question.$id).css('font-weight', 'bolder');
        $('#' + question.$id).css('font-size', '125%');
        $scope.userPath.child($scope.user).child('upvotedQuestions/' +
          question.$id).set(question.$id);
        $scope.questions.$save(question);
      } else {
        for (var i = 0; i < $scope.userQuestions.length; i++) {
          if (question.$id == $scope.userQuestions[i].$id) {
            $scope.newQuestion = false;
          }
        }
        if (!$scope.newQuestion) {
          question.upvotes = question.upvotes - 1;
          $('#' + question.$id).css('color', 'black');
          $('#' + question.$id).css('font-weight', 'normal');
          $('#' + question.$id).css('font-size', '100%');
          $scope.questionToRemove = $scope.userQuestions.$getRecord(
            question.$id);
          $scope.userQuestions.$remove($scope.questionToRemove)
          $scope.questions.$save(question);
          $scope.newQuestion = true;
        } else {
          question.upvotes = question.upvotes + 1;
          $('#' + question.$id).css('color', 'blue');
          $('#' + question.$id).css('font-weight', 'bolder');
          $('#' + question.$id).css('font-size', '125%');
          $scope.userPath.child($scope.user).child('upvotedQuestions/' +
            question.$id).set(question.$id);
          $scope.questions.$save(question);
          $scope.newQuestion = true;
        }
      }

      console.log("question voted")
    };

    // Generate a unique QR code for this session
    $scope.callQR = function() {
      var url = document.URL;
      var url = encodeURIComponent($routeParams.sessionID);
      var fullUrl =
        'https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=http://www.socratesapp.co/%23/sessions/' +
        url;
      $('#QR').attr('src', fullUrl);
    };

    function alert(msg) {
      $scope.err = msg;
      $timeout(function() {
        $scope.err = null;
      }, 5000);
    }
  });

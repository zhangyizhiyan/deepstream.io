var AuthenticationHandler = require( '../../src/authentication/file-based-authentication-handler' );

var testPermission = function( settings ) {
	var authData = {
		username: settings.username,
		password: settings.password
	};

	var callback = function( result, data ) {
		expect( result ).toBe( settings.expectedResult );
		if( settings.authData ) {
			expect( data.authData ).toEqual( settings.authData );
		}
		settings.done();
	};

	settings.handler.isValidUser( null, authData, callback );
};

describe( 'does authentication for hashed passwords', function(){
	var authenticationHandler;
	var settings = {
		path: './test/test-configs/users-unhashed.json',
		hash: false
	};

	it( 'creates the authentication handler', function( done ){
		authenticationHandler = new AuthenticationHandler( settings );
		authenticationHandler.on( 'ready', done );
	});

	it( 'confirms userC with valid password', function( done ){
		testPermission({
			username: 'userC',
			password: 'userCPass',
			expectedError: null,
			expectedResult: true,
			done: done,
			handler: authenticationHandler
		});
	});

	it( 'rejects userC with invalid password', function( done ){
		testPermission({
			username: 'userC',
			password: 'userDPass',
			expectedError: null,
			expectedResult: false,
			done: done,
			handler: authenticationHandler
		});
	});
});

describe( 'does authentication for hashed passwords', function(){
	var authenticationHandler;
	var settings = {
		path: './test/test-configs/users.json',
		hash: 'md5',
		iterations: 100,
		keyLength: 32
	};

	it( 'creates the authentication handler', function( done ){
		authenticationHandler = new AuthenticationHandler( settings );
		authenticationHandler.on( 'ready', done );
	});

	it( 'confirms userA with valid password', function( done ){
		testPermission({
			username: 'userA',
			password: 'userAPass',
			expectedError: null,
			expectedResult: true,
			expectedData: { "some": "values" },
			done: done,
			handler: authenticationHandler
		});
	});

	it( 'rejects userA with an invalid password', function( done ){
		testPermission({
			username: 'userA',
			password: 'wrongPassword',
			expectedError: null,
			expectedResult: false,
			done: done,
			handler: authenticationHandler
		});
	});

	it( 'rejects userA with user B\'s password', function( done ){
		testPermission({
			username: 'userA',
			password: 'userBPass',
			expectedError: null,
			expectedResult: false,
			done: done,
			handler: authenticationHandler
		});
	});

	it( 'accepts userB with user B\'s password', function( done ){
		testPermission({
			username: 'userB',
			password: 'userBPass',
			expectedError: null,
			expectedResult: true,
			done: done,
			handler: authenticationHandler
		});
	});

	it( 'rejects unknown userQ', function( done ){
		testPermission({
			username: 'userQ',
			password: 'userBPass',
			expectedError: null,
			expectedResult: false,
			done: done,
			handler: authenticationHandler
		});
	});
});

describe( 'errors for invalid settings', function(){
	var getSettings = function() {
		return {
			path: './test/test-configs/users.json',
			hash: 'md5',
			iterations: 100,
			keyLength: 32
		};
	};

	it( 'accepts valid settings', function(){
		expect(function(){
			new AuthenticationHandler( getSettings() );
		}).not.toThrow();
	});

	it( 'errors for invalid path', function(){
		var settings = getSettings();
		settings.path = 42;
		expect(function(){
			new AuthenticationHandler( settings );
		}).toThrow();
	});

	it( 'accepts settings with hash = false', function(){
		var settings = {
			path: './test/test-configs/users-unhashed.json',
			hash: false
		};

		expect(function(){
			new AuthenticationHandler( settings );
		}).not.toThrow();
	});

	it( 'fails for settings with hash=string that miss hashing parameters', function(){
		var settings = {
			path: './test/test-configs/users-unhashed.json',
			hash: 'md5'
		};

		expect(function(){
			new AuthenticationHandler( settings );
		}).toThrow();
	});

	it( 'fails for settings with non-existing hash algorithm', function(){
		var settings = getSettings();
		settings.hash = 'does-not-exist';

		expect(function(){
			new AuthenticationHandler( settings );
		}).toThrow();
	});
});

describe( 'creates hashes', function(){
	var authenticationHandler;
	var settings = {
		path: './test/test-configs/users.json',
		hash: 'md5',
		iterations: 100,
		keyLength: 32
	};

	it( 'creates the authentication handler', function( done ){
		authenticationHandler = new AuthenticationHandler( settings );
		authenticationHandler.on( 'ready', done );
	});

	it( 'creates a hash', function( done ){
		authenticationHandler.createHash( 'userAPass', function( err, result ){
			expect( err ).toBe( null );
			expect( typeof result ).toBe( 'string' );
			done();
		});
	});
});

describe( 'errors for invalid configs', function(){
	it( 'loads a non existant config', function( done ){
		var authenticationHandler = new AuthenticationHandler({
			path: './does-not-exist.json',
			hash: false
		});

		authenticationHandler.on( 'error', function( error ){
			expect( error ).toContain( 'error while loading config' );
			done();
		});
	});

	it( 'loads a broken config', function( done ){
		var authenticationHandler = new AuthenticationHandler({
			path: './test/test-configs/broken-json-config.json',
			hash: false
		});

		authenticationHandler.on( 'error', function( error ){
			expect( error ).toContain( 'error while parsing config' );
			done();
		});
	});

	it( 'loads a user config without password field', function( done ){
		var authenticationHandler = new AuthenticationHandler({
			path: './test/test-configs/invalid-user-config.json',
			hash: false
		});

		authenticationHandler.on( 'error', function( error ){
			expect( error ).toBe( 'missing password for userB' );
			done();
		});
	});
});

describe( 'errors for invalid auth-data', function(){
	var authenticationHandler;
	var settings = {
		path: './test/test-configs/users.json',
		hash: 'md5',
		iterations: 100,
		keyLength: 32
	};

	it( 'creates the authentication handler', function( done ){
		authenticationHandler = new AuthenticationHandler( settings );
		authenticationHandler.on( 'ready', done );
	});

	it( 'returns an error for authData without username', function( done ){
			var authData = {
			password: 'some password'
		};

		var callback = function( result, data ) {
			expect( result ).toBe( false );
			expect( data.clientData ).toBe( 'missing authentication parameter username' );
			done();
		};

		authenticationHandler.isValidUser( null, authData, callback );
	});

	it( 'returns an error for authData without password', function( done ){
		var authData = {
			username: 'some user'
		};

		var callback = function( result, data ) {
			expect( result ).toBe( false );
			expect( data.clientData ).toBe( 'missing authentication parameter password' );
			done();
		};

		authenticationHandler.isValidUser( null, authData, callback );
	});

});
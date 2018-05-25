//----------------------------------------------------
// Author: Sergiman94 - Sergio Andres Manrique
// Universidad San Buenaventura
// Curso de Computacion Grafica
// Profesor Andres Felipe Barco Santa - Anfelbar
//----------------------------------------------------

var clock = new THREE.Clock();
var floorObject;
var clickRequest = false;
var mouseCoords = new THREE.Vector2();
var array =[];
// Graphics variables
var container, stats;
var camera, controls, scene, renderer;
var ambientLight;

//Physics variables
var gravityConstant = -9.8;
var gravity = new Ammo.btVector3( 0, gravityConstant, 0 );
var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var margin = 0.05
var physicsWorld;
var rigidBodies = [];
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );
var transformAux1 = new Ammo.btTransform()

var collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
var dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
var broadphase = new Ammo.btDbvtBroadphase();
var solver = new Ammo.btSequentialImpulseConstraintSolver();
var softBodySolver = new Ammo.btDefaultSoftBodySolver();
physicsWorld = new Ammo.btSoftRigidDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration, softBodySolver)
physicsWorld.setGravity( gravity );
physicsWorld.getWorldInfo().set_m_gravity( gravity);


var mass = 1;

function PObjects(){

  this.loadOBJModel = function (x, y, z, sx, sy, sz, modelObj, mass) {
    var objLoader = new THREE.OBJLoader();
  	objLoader.load(modelObj, function(mesh){

      mesh.scale.set(5, 5, 5);

      var mScale = mesh.scale;

      //console.log(mScale);

      mesh.traverse(function(node){
  			if( node instanceof THREE.Mesh ){
  				node.castShadow = true;
  				node.receiveShadow = true;
  			}
  		});

      var pos = new THREE.Vector3();
  		var quat = new THREE.Quaternion();
      //var mass = 10;

      pos.set(x, y, z);
			quat.set(0,0,0,1);
      var amoVector = new Ammo.btVector3( 20 , 0, 0.5);

      var shape = new Ammo.btBoxShape( amoVector);

      //console.log(shape);

      shape.setMargin(0.05);
      createRigidBody( mesh, shape, mass, pos, quat );



  		// scene.add(mesh);
  		// mesh.position.set(0, 0, 0);
  		// mesh.rotation.y = -Math.PI/rotate;

  	});

  }

  this.loadJSONModel = function ( sx, sy, sz, objPath, mass) {

    mixer = new THREE.AnimationMixer( scene );
		var loader = new THREE.JSONLoader();

    loader.load( objPath, function ( geometry, materials ) {
			//adjust color a bit
		  //var material = materials[0];

			//materials.morphTargets = true;
			//materials.color.setHex( 0xFACC2E );

      //console.log(geometry);

			var mesh = new THREE.Mesh( geometry, materials );

      //console.log(mesh);

      //mesh.scale.set(40, 40, 40);

      //mesh.position.set(-80,50,-14);
      // mesh.rotation.y = -Math.PI/2;
			// mesh.matrixAutoUpdate = false;
			// mesh.updateMatrix();

      var pos = new THREE.Vector3();
  		var quat = new THREE.Quaternion();
      //var mass = 10;

      pos.set(10,20,-14);
			quat.set(0,0,0,1);
      var amoVector = new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 );
      var shape = new Ammo.btBoxShape( amoVector);
      shape.setMargin(0.02);



      createRigidBody( geometry, shape, mass, pos, quat );
			//scene.add( mesh );

    });
  }

  this.createParalellepiped = function ( sx, sy, sz, mass, pos, quat, material) {

    var geometry = new THREE.BoxGeometry(sx, sy, sz);

    var threeObject = new THREE.Mesh( geometry, material );

    var shapeVector = new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 );

    var shape = new Ammo.btBoxShape( shapeVector);


    shape.setMargin( margin );

    createRigidBody( threeObject, shape, mass, pos, quat );

    threeObject.castShadow = true
    threeObject.receiveShadow = true;

    group.add(threeObject);






    //console.log(geometry);


    // textureLoader.load( "models/grid.png", function( texture ) {
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set( 40, 40 );
    // ground.material.map = texture;
    // ground.material.needsUpdate = true;
    //} );

    return threeObject;
  }

  this.floor = function () {
    pos.set( 0, -2, 0 );
    quat.set( 0, 0, 0, 1 );
    var paralelllepipedMaterial = new THREE.MeshPhongMaterial( { color: 0x21610B } )
    this.createParalellepiped(2000, 1, 2000, 0, pos, quat, paralelllepipedMaterial);
  }

  this.ball = function () {

    // Creates a ball
    var ballMass = 0.01;
    var ballRadius = 1;
    var ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 18, 16 ), ballMaterial );

    ball.castShadow = true;
    ball.receiveShadow = true;

    var ballShape = new Ammo.btSphereShape( ballRadius );

    ballShape.setMargin( margin );
    pos.copy( raycaster.ray.direction );
    pos.set( 15,50,18 );
    quat.set( 0, 0, 0, 1 );

    var ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );
    ballBody.setFriction( 0.5 );
    //pos.copy( raycaster.ray.direction );
    //pos.multiplyScalar( 14 );
    //ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

    return ballBody;

  }

  this.ballSpawn = function (ballTexture, xOffset, y, zOffset) {

    // Creates a ball
    var ballMass = 0.01;
    var ballRadius = 1;


    var xDistance = 0.5;
    var zDistance = 1;

    var whiteMaterial = new THREE.MeshPhongMaterial({color: 0xffffff});

    var geometry = new THREE.SphereGeometry( ballRadius, 18, 16 )

    // for (var i = 0; i < 4; i++){
    //   for(var j = 0; j < 4; j++){

        var ball = new THREE.Mesh( geometry , whiteMaterial );

        textureLoader.load( ballTexture, function( texture ) {
    					texture.wrapS = THREE.RepeatWrapping;
    					texture.wrapT = THREE.RepeatWrapping;
    					texture.repeat.set(1,1);
    					ball.material.map = texture;
    					ball.material.needsUpdate = true;
    				}
        );

        // var xDist = (xDistance * i) + xOffset;
        // var zDist = (zDistance * j) + zOffset;

        ball.castShadow = true;
        ball.receiveShadow = true;

        spawnBalls.push(ball);
        //console.log(spawnBalls);

        var ballShape = new Ammo.btSphereShape( ballRadius );

        ballShape.setMargin( margin );
        pos.copy( raycaster.ray.direction );
        //pos.set( 15,15,18 );
        //pos.set(xDist, y, zDist);
        pos.set(0,y,0)
        quat.set( 0, 0, 0, 1 );

        var ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );
        ballBody.setFriction( 0.5 );
        pos.copy( raycaster.ray.direction );
        pos.multiplyScalar( 14 );
        ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    //   }
    // }

  }

}

function createRigidBody( threeObject, physicsShape, mass, pos, quat ) {

    threeObject.position.copy( pos);
    threeObject.quaternion.copy( quat );

    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );

    var motionState = new Ammo.btDefaultMotionState( transform );
    var localInertia = new Ammo.btVector3( 0, 0, 0 );

    physicsShape.calculateLocalInertia( mass, localInertia );

    var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );

    var body = new Ammo.btRigidBody( rbInfo );

    threeObject.userData.physicsBody = body;
    scene.add( threeObject );

    if ( mass > 0 ) {
      rigidBodies.push( threeObject );
      // Disable deactivation
      body.setActivationState( 4 );
    }
    physicsWorld.addRigidBody( body );
      return body;
  }

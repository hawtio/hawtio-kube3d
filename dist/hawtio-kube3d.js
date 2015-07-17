/// Copyright 2014-2015 Red Hat, Inc. and/or its affiliates
/// and other contributors as indicated by the @author tags.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.


var Kube3d;
(function (Kube3d) {
    Kube3d.W = 1;
    Kube3d.S = 0;
    Kube3d.WALL = Kube3d.W;
    Kube3d.SPACE = Kube3d.S;
    Kube3d.CELL_SIZE = 100;
    Kube3d.FLOOR_LEVEL = -Kube3d.CELL_SIZE;
    ;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d.pluginName = 'Kube3d';
    Kube3d.log = Logger.get(Kube3d.pluginName);
    Kube3d.templatePath = 'plugins/kube3d/html';
    Kube3d.havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    Kube3d.HalfPI = Math.PI / 2;
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    Kube3d.rgbToHex = rgbToHex;
    function randomGrey() {
        var rgbVal = Math.random() * 128 + 128;
        return rgbToHex(rgbVal, rgbVal, rgbVal);
    }
    Kube3d.randomGrey = randomGrey;
    function webglAvailable() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        }
        catch (e) {
            return false;
        }
    }
    Kube3d.webglAvailable = webglAvailable;
    function placeObject(cellX, cellY, isFloor) {
        if (isFloor === void 0) { isFloor = false; }
        var x = cellX * Kube3d.CELL_SIZE;
        var z = cellY * Kube3d.CELL_SIZE;
        var y = isFloor ? Kube3d.FLOOR_LEVEL : 0;
        return [x, y, z];
    }
    Kube3d.placeObject = placeObject;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d._module = angular.module(Kube3d.pluginName, []);
    Kube3d.controller = PluginHelpers.createControllerFunction(Kube3d._module, Kube3d.pluginName);
    var tab = undefined;
    Kube3d._module.config(['$routeProvider', "HawtioNavBuilderProvider", function ($routeProvider, builder) {
        tab = builder.create().id(Kube3d.pluginName).title(function () { return '3D View'; }).href(function () { return '/kubernetes/3d'; }).page(function () { return builder.join(Kube3d.templatePath, 'view.html'); }).build();
        builder.configureRouting($routeProvider, tab);
    }]);
    Kube3d._module.run(['HawtioNav', function (nav) {
        nav.on(HawtioMainNav.Actions.ADD, Kube3d.pluginName, function (item) {
            if (item.id !== 'kubernetes') {
                return;
            }
            if (!_.any(item.tabs, function (tab) { return tab.id === Kube3d.pluginName; })) {
                item.tabs.push(tab);
            }
        });
    }]);
    hawtioPluginLoader.addModule(Kube3d.pluginName);
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d._module.directive('requestLock', ['$document', function ($document) {
        return {
            restrict: 'A',
            scope: {
                'onLock': '&requestLock'
            },
            link: function (scope, element, attr) {
                var el = element[0] || element;
                if (Kube3d.havePointerLock) {
                    Kube3d.log.debug("here!");
                    var doc = $document[0];
                    var body = doc.body;
                    var pointerlockchange = function (event) {
                        if (doc.pointerLockElement === body || doc.mozPointerLockElement === body || doc.webkitPointerLockElement === body) {
                            el.style.display = 'none';
                            scope.onLock({ lock: true });
                        }
                        else {
                            el.style.display = '';
                            scope.onLock({ lock: false });
                        }
                        Core.$apply(scope);
                    };
                    var pointerlockerror = function (event) {
                        el.style.display = '';
                    };
                    doc.addEventListener('pointerlockchange', pointerlockchange, false);
                    doc.addEventListener('mozpointerlockchange', pointerlockchange, false);
                    doc.addEventListener('webkitpointerlockchange', pointerlockchange, false);
                    doc.addEventListener('pointerlockerror', pointerlockerror, false);
                    doc.addEventListener('mozpointerlockerror', pointerlockerror, false);
                    doc.addEventListener('webkitpointerlockerror', pointerlockerror, false);
                    el.addEventListener('click', function (event) {
                        el.style.display = 'none';
                        body.requestPointerLock = body.requestPointerLock || body.mozRequestPointerLock || body.webkitRequestPointerLock;
                        body.requestPointerLock();
                    });
                }
                else {
                    el.style.display = 'none';
                }
            }
        };
    }]);
})(Kube3d || (Kube3d = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Kube3d;
(function (Kube3d) {
    var log = Logger.get('Kube3d');
    var SceneObjectBase = (function () {
        function SceneObjectBase(scene, geometry) {
            this.scene = scene;
            this.geometry = geometry;
            this.boundingBox = null;
            this.scene.add(geometry);
            this.boundingBox = new THREE.BoundingBoxHelper(this.geometry, 0x00ff00);
            this.scene.add(this.boundingBox);
        }
        SceneObjectBase.prototype.destroy = function () {
            this.scene.remove(this.geometry);
            this.geometry.dispose();
            delete this.geometry;
        };
        SceneObjectBase.prototype.debug = function (enable) {
            this.boundingBox.visible = enable;
        };
        SceneObjectBase.prototype.move = function (x, y, z) {
            this.geometry.position.x += x;
            this.geometry.position.y += y;
            this.geometry.position.z += z;
            this.boundingBox.position.x += x;
            this.boundingBox.position.y += y;
            this.boundingBox.position.z += z;
        };
        SceneObjectBase.prototype.rotate = function (rx, ry, rz) {
            this.geometry.rotation.x += rx;
            this.geometry.rotation.y += ry;
            this.geometry.rotation.z += rz;
            this.boundingBox.rotation.x += rx;
            this.boundingBox.rotation.y += ry;
            this.boundingBox.rotation.z += rz;
        };
        SceneObjectBase.prototype.getPosition = function () {
            this.boundingBox.update();
            return this.boundingBox.object.position;
        };
        SceneObjectBase.prototype.setPosition = function (x, y, z) {
            this.geometry.position.x = x;
            this.geometry.position.y = y;
            this.geometry.position.z = z;
            this.boundingBox.position.x = x;
            this.boundingBox.position.y = y;
            this.boundingBox.position.z = z;
        };
        SceneObjectBase.prototype.setRotation = function (rx, ry, rz) {
            this.geometry.rotation.x = rx;
            this.geometry.rotation.y = ry;
            this.geometry.rotation.z = rz;
            this.geometry.rotation.x = rx;
            this.geometry.rotation.y = ry;
            this.geometry.rotation.z = rz;
        };
        SceneObjectBase.prototype.render = function () {
            this.boundingBox.update();
        };
        return SceneObjectBase;
    })();
    Kube3d.SceneObjectBase = SceneObjectBase;
    var PodObject = (function (_super) {
        __extends(PodObject, _super);
        function PodObject(scene, hostObject, id, obj) {
            _super.call(this, scene, new THREE.Object3D());
            this.scene = scene;
            this.hostObject = hostObject;
            this.id = id;
            this.obj = obj;
            this.angle = undefined;
            this.circle = undefined;
            this.rotation = {
                x: Math.random() * Math.PI / 1000,
                y: Math.random() * Math.PI / 100,
                z: Math.random() * Math.PI / 1000
            };
            var texture = THREE.ImageUtils.loadTexture(obj.$iconUrl);
            texture.minFilter = THREE.NearestFilter;
            this.geometry.add(new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshPhongMaterial({
                color: 0xffffff,
                map: texture,
                bumpMap: texture,
                castShadow: true,
                receiveShadow: true,
                shading: THREE.SmoothShading
            })));
            log.debug("Created pod object ", id);
        }
        PodObject.prototype.update = function (model, pod) {
            this.obj = pod;
        };
        PodObject.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.hostObject.geometry.remove(this.circle);
            log.debug("Destroyed pod object ", this.id);
        };
        PodObject.prototype.distance = function () {
            var hostPosition = this.hostObject.getPosition();
            var myPosition = this.getPosition();
            var distX = Math.abs(hostPosition.x - myPosition.x);
            var distY = Math.abs(hostPosition.y - myPosition.y);
            return Math.sqrt(distX * distX + distY * distY);
        };
        PodObject.prototype.angleOfVelocity = function () {
            if (!this.angle) {
                var dist = this.distance();
                log.debug("pod id: ", this.id, " distance: ", dist);
                this.angle = (1 / dist) * 10;
                log.debug("pod id: ", this.id, " angle: ", this.angle);
                var materialArray = [];
                var face = new THREE.MeshPhongMaterial({
                    color: 0x555555,
                    castShadow: true,
                    receiveShadow: true,
                    wireframe: true
                });
                materialArray.push(face.clone());
                materialArray.push(face.clone());
                this.circle = new THREE.Mesh(new THREE.RingGeometry(dist - 1, dist + 1, 128), new THREE.MeshFaceMaterial(materialArray));
                this.hostObject.geometry.add(this.circle);
            }
            return this.angle;
        };
        PodObject.prototype.render = function () {
            var myPosition = this.getPosition();
            var hostPosition = this.hostObject.getPosition();
            var x = myPosition.x;
            var y = myPosition.y;
            var centerX = hostPosition.x;
            var centerY = hostPosition.y;
            var offsetX = x - centerX;
            var offsetY = y - centerY;
            var angle = this.angleOfVelocity();
            var newX = centerX + offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
            var newY = centerY + offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
            this.setPosition(newX, newY, 0);
            this.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
            _super.prototype.render.call(this);
        };
        return PodObject;
    })(SceneObjectBase);
    Kube3d.PodObject = PodObject;
    var HostObject = (function (_super) {
        __extends(HostObject, _super);
        function HostObject(scene, id, obj) {
            _super.call(this, scene, new THREE.Object3D());
            this.id = id;
            this.obj = obj;
            this.offsetX = 200;
            this.offsetY = 200;
            this.pods = {};
            this.rotation = {
                x: 0,
                y: 0,
                z: Math.random() * Math.PI / 1000
            };
            this.step = 0;
            var texture = THREE.ImageUtils.loadTexture('img/sun-texture.jpg');
            texture.minFilter = THREE.NearestFilter;
            this.geometry.add(new THREE.PointLight(0xffd700, 1, 5000), new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshPhongMaterial({
                color: 0xffd700,
                map: texture,
                bumpMap: texture,
                specular: 0x00ff00,
                shading: THREE.SmoothShading
            })));
            log.debug("Created host object ", id);
        }
        HostObject.prototype.update = function (model, host) {
            var _this = this;
            this.obj = host;
            var podsToRemove = [];
            _.forIn(this.pods, function (pod, key) {
                if (!(key in model.podsByKey)) {
                    podsToRemove.push(key);
                }
            });
            _.forEach(podsToRemove, function (id) { return _this.removePod(id); });
            _.forEach(this.obj.pods, function (pod) {
                var name = pod._key;
                if (!_this.hasPod(name)) {
                    _this.addPod(name, pod);
                }
                else {
                    var podObj = _this.pods[name];
                    podObj.update(model, pod);
                }
            });
        };
        HostObject.prototype.debug = function (enable) {
            var _this = this;
            var ids = _.keys(this.pods);
            _.forEach(ids, function (id) { return _this.pods[id].debug(enable); });
            _super.prototype.debug.call(this, enable);
        };
        HostObject.prototype.destroy = function () {
            var _this = this;
            if (this.pods) {
                var podIds = _.keys(this.pods);
                _.forEach(podIds, function (id) { return _this.removePod(id); });
            }
            _super.prototype.destroy.call(this);
            log.debug("Destroying host object ", this.id);
        };
        HostObject.prototype.removePod = function (id) {
            var pod = this.pods[id];
            if (pod) {
                pod.destroy();
                delete this.pods[id];
            }
        };
        HostObject.prototype.addPod = function (key, p) {
            if (this.hasPod(key)) {
                return;
            }
            var myPosition = this.getPosition();
            var podOffsetX = this.offsetX - myPosition.x;
            var podOffsetY = myPosition.y;
            var pod = new PodObject(this.scene, this, key, p);
            pod.setPosition(myPosition.x, myPosition.y, myPosition.z);
            pod.move(this.offsetX, 0, 0);
            this.offsetX = this.offsetX + Math.random() * 50 + 100;
            this.offsetY = this.offsetY + Math.random() * 50 + 100;
            this.pods[key] = pod;
        };
        HostObject.prototype.hasPod = function (id) {
            return (id in this.pods);
        };
        HostObject.prototype.render = function () {
            this.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
            _.forIn(this.pods, function (podObject, id) {
                podObject.render();
            });
            this.step = this.step + 1;
            _super.prototype.render.call(this);
        };
        return HostObject;
    })(SceneObjectBase);
    Kube3d.HostObject = HostObject;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    var levelData = [
        [Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W]
    ];
    var levelWidth = levelData[0].length;
    var levelHeight = levelData.length;
    var wallTexture = THREE.ImageUtils.loadTexture('img/IMGP1450.jpg');
    wallTexture.minFilter = THREE.NearestFilter;
    var wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        map: wallTexture,
        wireframe: false
    });
    var wall = new THREE.Mesh(new THREE.BoxGeometry(Kube3d.CELL_SIZE, Kube3d.CELL_SIZE, Kube3d.CELL_SIZE), wallMaterial);
    var floorTexture = THREE.ImageUtils.loadTexture('img/IMGP1450.jpg');
    floorTexture.minFilter = THREE.NearestFilter;
    var floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        map: floorTexture,
        wireframe: false
    });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(Kube3d.CELL_SIZE, Kube3d.CELL_SIZE, Kube3d.CELL_SIZE), floorMaterial);
    function makeBox(cellX, cellY, isFloor) {
        if (isFloor === void 0) { isFloor = false; }
        var box = isFloor ? floor.clone() : wall.clone();
        box.position.fromArray(Kube3d.placeObject(cellX, cellY, isFloor));
        return box;
    }
    var World = (function () {
        function World(scene) {
            this.scene = scene;
            this.ambient = new THREE.AmbientLight(0xffffff);
            this.light = new THREE.DirectionalLight(0x888888);
            this.ambient.color.setHSL(0.1, 0.3, 0.2);
            this.light.position.set(1, 1, 0);
            scene.add(this.ambient);
            scene.add(this.light);
            var materialArray = [];
            for (var i = 0; i < 6; i++)
                materialArray.push(new THREE.MeshBasicMaterial({
                    map: THREE.ImageUtils.loadTexture('img/space-seamless.png'),
                    side: THREE.BackSide
                }));
            var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
            scene.add(new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyMaterial));
            _.forEach(levelData, function (row, y) {
                _.forEach(row, function (cell, x) {
                    switch (cell) {
                        case Kube3d.WALL:
                            scene.add(makeBox(x, y, false));
                            break;
                    }
                    scene.add(makeBox(x, y, true));
                });
            });
        }
        World.prototype.placePlayer = function (object) {
            this.placeObject(object);
        };
        World.prototype.placeObject = function (object) {
            if (!object || !object.position) {
                return;
            }
            var x, y;
            do {
                x = Math.floor(Math.random() * (levelWidth - 2) + 1);
                y = Math.floor(Math.random() * (levelHeight - 2) + 1);
                Kube3d.log.debug("x:", x, "y:", y, "val:", levelData[y][x]);
            } while (levelData[y][x] !== Kube3d.SPACE);
            object.position.fromArray(Kube3d.placeObject(x, y));
        };
        World.prototype.render = function () {
        };
        World.prototype.destroy = function () {
        };
        return World;
    })();
    Kube3d.World = World;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    var Player = (function () {
        function Player(scene, camera, d, world) {
            this.scene = scene;
            this.camera = camera;
            this.d = d;
            this.world = world;
            this.log = Logger.get('kube3d-player');
            this.domElement = null;
            this._lookAt = null;
            this.pitch = new THREE.Object3D();
            this.yaw = new THREE.Object3D();
            this._enabled = false;
            this._document = undefined;
            this.getWorldObjects = function () { return []; };
            this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
            this.forward = false;
            this.backward = false;
            this.left = false;
            this.right = false;
            this.canJump = true;
            this.velocity = new THREE.Vector3();
            this.prevTime = performance.now();
            this.handlers = null;
            camera.rotation.set(0, 0, 0);
            camera.position.set(0, 0, 0);
            this.pitch.add(camera);
            this.yaw.add(this.pitch);
            scene.add(this.yaw);
            this.yaw.position.set(0, 0, -5);
            var domElement = this.domElement = $(d);
            if (!Kube3d.havePointerLock) {
                this.enabled = true;
            }
            var self = this;
            self.handlers = {
                'keydown': function (event) {
                    switch (event.keyCode) {
                        case 38:
                        case 87:
                            self.forward = true;
                            break;
                        case 37:
                        case 65:
                            self.left = true;
                            break;
                        case 40:
                        case 83:
                            self.backward = true;
                            break;
                        case 39:
                        case 68:
                            self.right = true;
                            break;
                        case 32:
                            if (self.canJump === true) {
                                self.velocity.y += 350;
                                self.canJump = false;
                            }
                            break;
                    }
                },
                'keyup': function (event) {
                    switch (event.keyCode) {
                        case 38:
                        case 87:
                            self.forward = false;
                            break;
                        case 37:
                        case 65:
                            self.left = false;
                            break;
                        case 40:
                        case 83:
                            self.backward = false;
                            break;
                        case 39:
                        case 68:
                            self.right = false;
                            break;
                    }
                },
                'mousemove': function (event) {
                    if (!self._enabled || !Kube3d.havePointerLock) {
                        return;
                    }
                    var yaw = self.yaw;
                    var pitch = self.pitch;
                    var deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                    var deltaY = event.movementY || event.mozMovementX || event.webkitMovementX || 0;
                    yaw.rotation.y -= deltaX * 0.002;
                    pitch.rotation.x -= deltaY * 0.002;
                    pitch.rotation.x = Math.max(-Kube3d.HalfPI, Math.min(Kube3d.HalfPI, pitch.rotation.x));
                }
            };
            _.forIn(this.handlers, function (handler, evt) { return document.addEventListener(evt, handler, false); });
        }
        Object.defineProperty(Player.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (enabled) {
                this._enabled = enabled;
                if (enabled) {
                    this.camera.position.set(0, 0, 0);
                    this.camera.rotation.set(0, 0, 0);
                    this.object.position.set(0, 0, 0);
                    this.world.placePlayer(this.object);
                }
                else {
                    this.yaw.position.set(0, 0, 0);
                    this.yaw.rotation.set(0, 0, 0);
                    this.pitch.rotation.set(0, 0, 0);
                }
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.setWorldObjectsCallback = function (func) {
            this.getWorldObjects = func;
        };
        Object.defineProperty(Player.prototype, "object", {
            get: function () {
                return this.yaw;
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.lookAt = function (box) {
            this._lookAt = box;
        };
        Player.prototype.destroy = function () {
            this.scene.remove(this.yaw);
            this.yaw.dispose();
            this.pitch.dispose();
            _.forIn(this.handlers, function (handler, evt) { return document.removeEventListener(evt, handler); });
        };
        Player.prototype.render = function () {
            if (!this.enabled || !Kube3d.havePointerLock) {
                if (this._lookAt) {
                    var angle = Date.now() * 0.0001;
                    this.camera.focus(this._lookAt, angle);
                }
                return;
            }
            var raycaster = this.raycaster;
            var velocity = this.velocity;
            var me = this.object;
            raycaster.ray.origin.copy(this.yaw.position);
            raycaster.ray.origin.y -= 10;
            var objects = this.getWorldObjects();
            var intersections = raycaster.intersectObjects(objects);
            var isOnObject = intersections.length > 0;
            var time = performance.now();
            var delta = (time - this.prevTime) / 1000;
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 100.0 * delta;
            if (this.forward)
                velocity.z -= 400.0 * delta;
            if (this.backward)
                velocity.z += 400.0 * delta;
            if (this.left)
                velocity.x -= 400.0 * delta;
            if (this.right)
                velocity.x += 400.0 * delta;
            if (isOnObject === true) {
                velocity.y = Math.max(0, velocity.y);
                this.canJump = true;
            }
            me.translateX(velocity.x * delta);
            me.translateY(velocity.y * delta);
            me.translateZ(velocity.z * delta);
            if (me.position.y < 10) {
                velocity.y = 0;
                me.position.y = 10;
                this.canJump = true;
            }
            this.prevTime = time;
        };
        return Player;
    })();
    Kube3d.Player = Player;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    var directiveName = 'threejs';
    Kube3d._module.directive(directiveName, [function () {
        THREE.ImageUtils.crossOrigin = '';
        return {
            restrict: 'A',
            replace: true,
            scope: {
                config: '=?' + directiveName
            },
            link: function (scope, element, attrs) {
                var scene = null;
                var camera = null;
                var renderer = null;
                var keepRendering = true;
                var resizeHandle = null;
                function stop() {
                    keepRendering = false;
                }
                function cleanup() {
                    $(window).off('resize', resizeFunc);
                    delete renderer;
                    delete camera;
                    delete scene;
                    element.empty();
                }
                var resizeFunc = function () {
                    Kube3d.log.debug("resizing");
                    element.find('canvas').width(element.width()).height(element.height());
                    camera.aspect = element.width() / element.height();
                    camera.updateProjectionMatrix();
                    renderer.setSize(element.width(), element.height());
                };
                element.on('$destroy', function () {
                    stop();
                    Kube3d.log.debug("scene destroyed");
                });
                scope.$watch('config', function (config) {
                    stop();
                    if (!config || !config.initialize) {
                        Kube3d.log.debug("no config, returning");
                        return;
                    }
                    Kube3d.log.debug("creating scene");
                    scene = new THREE.Scene();
                    camera = new THREE.PerspectiveCamera(60, element.width() / element.height(), 0.1, 20000);
                    camera.focus = function (box3, angle, c) {
                        if (c === void 0) { c = camera; }
                        var height = box3.size().y;
                        var width = box3.size().x / (camera.aspect / 2);
                        if (width < 0 || height < 0) {
                            return;
                        }
                        var distY = Math.round(height * Math.tan((camera.fov / 2) * (Math.PI / 180)));
                        var distX = Math.round(width * Math.tan((camera.fov / 2) * (Math.PI / 180)));
                        var distZ = (distY + distX);
                        var z = Math.round(c.position.z);
                        var period = 5.0;
                        c.position.x = distX * Math.cos(angle);
                        c.position.y = distY * Math.sin(angle);
                        if (z !== distZ) {
                            if (z > distZ) {
                                var v = (z - distZ) / period;
                                c.position.z = z - v;
                            }
                            if (z < distZ) {
                                var v = (distZ - z) / period;
                                c.position.z = z + v;
                            }
                        }
                        c.lookAt(box3.center());
                    };
                    if (Kube3d.webglAvailable()) {
                        renderer = new THREE.WebGLRenderer();
                    }
                    else {
                        renderer = new THREE.CanvasRenderer();
                    }
                    renderer.setPixelRatio(window.devicePixelRatio);
                    renderer.setSize(element.width(), element.height());
                    var domElement = renderer.domElement;
                    element.append(domElement);
                    $(window).on('resize', resizeFunc);
                    config.initialize(renderer, scene, camera, domElement);
                    var render = function () {
                        if (!keepRendering) {
                            cleanup();
                            return;
                        }
                        requestAnimationFrame(render);
                        if (config.render) {
                            config.render(renderer, scene, camera);
                        }
                        renderer.render(scene, camera);
                    };
                    keepRendering = true;
                    render();
                });
            }
        };
    }]);
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d.ViewController = Kube3d.controller('ViewController', ['$scope', 'KubernetesModel', 'KubernetesState', '$element', function ($scope, model, state, $element) {
        var debugScene = false;
        var renderer = undefined;
        var scene = undefined;
        var camera = undefined;
        var domElement = undefined;
        var sceneGeometry = new THREE.Object3D();
        var sceneBounds = new THREE.BoundingBoxHelper(sceneGeometry, 0xff0000);
        var hostObjects = {};
        var updating = false;
        var hasMouse = false;
        var player = null;
        var world = null;
        $scope.onLock = function (lock) {
            if (!player) {
                return;
            }
            player.enabled = lock;
        };
        $scope.config = {
            initialize: function (r, s, c, d) {
                Kube3d.log.debug("init called");
                renderer = r;
                scene = s;
                camera = c;
                domElement = d;
                world = new Kube3d.World(scene);
                player = new Kube3d.Player(scene, camera, d, world);
                scene.add(sceneGeometry);
                if (debugScene) {
                    scene.add(sceneBounds);
                }
                var axis = new THREE.AxisHelper(1000);
                scene.add(axis);
                sceneGeometry.rotation.x = 90;
                sceneGeometry.rotation.z = 90;
                sceneGeometry.position.x = 0;
                sceneGeometry.position.y = 0;
                sceneGeometry.position.z = 0;
                buildScene();
            },
            render: function (renderer, scene, camera) {
                if (updating) {
                    return;
                }
                world.render();
                var angle = Date.now() * 0.0001;
                sceneGeometry.position.x = 1000 * Math.cos(angle);
                sceneGeometry.position.z = 1000 * Math.sin(angle);
                _.forIn(hostObjects, function (hostObject, key) {
                    hostObject.render();
                });
                sceneBounds.update();
                player.lookAt(sceneBounds.box);
                player.render();
            }
        };
        function buildScene() {
            if (!scene) {
                return;
            }
            updating = true;
            var originX = 0;
            var originY = 0;
            var hostsToRemove = [];
            _.forIn(hostObjects, function (hostObject, key) {
                if (_.any(model.hosts, function (host) { return host.elementId === key; })) {
                    Kube3d.log.debug("Keeping host: ", key);
                }
                else {
                    hostsToRemove.push(key);
                }
            });
            _.forEach(hostsToRemove, function (key) {
                var hostObject = hostObjects[key];
                if (hostObject) {
                    hostObject.destroy();
                    delete hostObjects[key];
                }
            });
            _.forEach(model.hosts, function (host) {
                var id = host.elementId;
                Kube3d.log.debug("host: ", host);
                var hostObject = hostObjects[id] || new Kube3d.HostObject(sceneGeometry, id, host);
                if (!(id in hostObjects)) {
                    hostObject.setPosition(originX, originY, 0);
                    originX = originX + 500;
                    originY = originY + 500;
                    hostObjects[id] = hostObject;
                }
                hostObject.update(model, host);
                hostObject.debug(debugScene);
            });
            Kube3d.log.debug("model updated");
            updating = false;
        }
        $scope.$on('kubernetesModelUpdated', buildScene);
    }]);
})(Kube3d || (Kube3d = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwia3ViZTNkL3RzL2t1YmUzZEludGVyZmFjZXMudHMiLCJrdWJlM2QvdHMva3ViZTNkSGVscGVycy50cyIsImt1YmUzZC90cy9rdWJlM2RQbHVnaW4udHMiLCJrdWJlM2QvdHMvbG9ja1JlcXVlc3QudHMiLCJrdWJlM2QvdHMvb2JqZWN0cy50cyIsImt1YmUzZC90cy93b3JsZC50cyIsImt1YmUzZC90cy9wbGF5ZXIudHMiLCJrdWJlM2QvdHMvdGhyZWVKU0RpcmVjdGl2ZS50cyIsImt1YmUzZC90cy92aWV3LnRzIl0sIm5hbWVzIjpbIkt1YmUzZCIsIkt1YmUzZC5yZ2JUb0hleCIsIkt1YmUzZC5yYW5kb21HcmV5IiwiS3ViZTNkLndlYmdsQXZhaWxhYmxlIiwiS3ViZTNkLnBsYWNlT2JqZWN0IiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuY29uc3RydWN0b3IiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlc3Ryb3kiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlYnVnIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5tb3ZlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5yb3RhdGUiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmdldFBvc2l0aW9uIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5zZXRQb3NpdGlvbiIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2Uuc2V0Um90YXRpb24iLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnJlbmRlciIsIkt1YmUzZC5Qb2RPYmplY3QiLCJLdWJlM2QuUG9kT2JqZWN0LmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBvZE9iamVjdC51cGRhdGUiLCJLdWJlM2QuUG9kT2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuUG9kT2JqZWN0LmRpc3RhbmNlIiwiS3ViZTNkLlBvZE9iamVjdC5hbmdsZU9mVmVsb2NpdHkiLCJLdWJlM2QuUG9kT2JqZWN0LnJlbmRlciIsIkt1YmUzZC5Ib3N0T2JqZWN0IiwiS3ViZTNkLkhvc3RPYmplY3QuY29uc3RydWN0b3IiLCJLdWJlM2QuSG9zdE9iamVjdC51cGRhdGUiLCJLdWJlM2QuSG9zdE9iamVjdC5kZWJ1ZyIsIkt1YmUzZC5Ib3N0T2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW1vdmVQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5hZGRQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5oYXNQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW5kZXIiLCJLdWJlM2QubWFrZUJveCIsIkt1YmUzZC5Xb3JsZCIsIkt1YmUzZC5Xb3JsZC5jb25zdHJ1Y3RvciIsIkt1YmUzZC5Xb3JsZC5wbGFjZVBsYXllciIsIkt1YmUzZC5Xb3JsZC5wbGFjZU9iamVjdCIsIkt1YmUzZC5Xb3JsZC5yZW5kZXIiLCJLdWJlM2QuV29ybGQuZGVzdHJveSIsIkt1YmUzZC5QbGF5ZXIiLCJLdWJlM2QuUGxheWVyLmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBsYXllci5lbmFibGVkIiwiS3ViZTNkLlBsYXllci5zZXRXb3JsZE9iamVjdHNDYWxsYmFjayIsIkt1YmUzZC5QbGF5ZXIub2JqZWN0IiwiS3ViZTNkLlBsYXllci5sb29rQXQiLCJLdWJlM2QuUGxheWVyLmRlc3Ryb3kiLCJLdWJlM2QuUGxheWVyLnJlbmRlciIsIkt1YmUzZC5zdG9wIiwiS3ViZTNkLmNsZWFudXAiLCJLdWJlM2QuYnVpbGRTY2VuZSJdLCJtYXBwaW5ncyI6IkFBa0JzQjs7QUNqQnRCLElBQU8sTUFBTSxDQW9CWjtBQXBCRCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBRUZBLFFBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ05BLFFBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ05BLFdBQUlBLEdBQUdBLFFBQUNBLENBQUNBO0lBQ1RBLFlBQUtBLEdBQUdBLFFBQUNBLENBQUNBO0lBRVZBLGdCQUFTQSxHQUFHQSxHQUFHQSxDQUFDQTtJQUNoQkEsa0JBQVdBLEdBQUdBLENBQUNBLGdC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LENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xEQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxREEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ3ZEQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN2REEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBRU1OLDJCQUFNQSxHQUFiQSxVQUFjQSxFQUFFQTtZQUNkTyxNQUFNQSxDQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMzQkEsQ0FBQ0E7UUFJTVAsMkJBQU1BLEdBQWJBO1lBQ0VRLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQy9EQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFDQSxTQUFTQSxF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QUFDQTtZQUkxQkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUN2QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDekJBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRXBCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUVoQ0EsSUFBSUEsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFeENBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLHNCQUFlQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDckJBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBO1lBQ3RCQSxDQUFDQTtZQUVEQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUVoQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0E7Z0JBQ2RBLFNBQVNBLEVBQUVBLFVBQUNBLEtBQVNBO29CQUNuQkEsTUFBTUEsQ0FBQ0EsQ0FBRUEsS0FBS0EsQ0FBQ0EsT0FBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3hCQSxLQUFLQSxFQUFFQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUE7NEJBQ0xBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBOzRCQUNwQkEsS0FBS0EsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQTs0QkFDTEEsSUFBSUEsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ2pCQSxLQUFLQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBOzRCQUNMQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQTs0QkFDckJBLEtBQUtBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUE7NEJBQ0xBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBOzRCQUNsQkEsS0FBS0EsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBOzRCQUNMQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxLQUFLQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDMUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLEdBQUdBLENBQUNBO2dDQUN2QkEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsS0FBS0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTs0QkFDREEsS0FBS0EsQ0FBQ0E7b0JBQ1ZBLENBQUNBO2dCQUNIQSxDQUFDQTtnQkFDREEsT0FBT0EsRUFBRUEsVUFBQ0EsS0FBU0E7b0JBQ2pCQSxNQUFNQSxDQUFDQSxDQUFFQSxLQUFLQSxDQUFDQSxPQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDeEJBLEtBQUtBLEVBQUVBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQTs0QkFDTEEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsS0FBS0EsQ0FBQ0E7NEJBQ3JCQSxLQUFLQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBOzRCQUNMQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQTs0QkFDbEJB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Q0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsR0FBR0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBRXpGQSxNQUFNQSxDQUFDQSxLQUFLQSxHQUFHQSxVQUFDQSxJQUFRQSxFQUFFQSxLQUFLQSxFQUFFQSxDQUFjQTt3QkFBZEEsaUJBQWNBLEdBQWRBLFVBQWNBO3dCQUc3Q0EsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzNCQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFFaERBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLElBQUlBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBOzRCQUM1QkEsTUFBTUEsQ0FBQ0E7d0JBQ1RBLENBQUNBO3dCQUNEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFFQSxHQUFHQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbEZBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNqRkEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBRTVCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDakNBLElBQUlBLE1BQU1BLEdBQUdBLEdBQUdBLENBQUNBO3dCQUNqQkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDdkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBOzRCQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTs0QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTt3QkFDSEEsQ0FBQ0E7d0JBQ0RBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlB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QUFHQSxPQUFPQSxHQUFHQSxHQUFHQSxDQUFDQTtvQkFDeEJBLFdBQVdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBO2dCQUMvQkEsQ0FBQ0E7Z0JBQ0RBLFVBQVVBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUMvQkEsVUFBVUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDL0JBLENBQUNBLENBQUNBLENBQUNBO1lBRUhBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO1lBQzNCQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUNuQkEsQ0FBQ0E7UUFDRGhELE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLHdCQUF3QkEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7SUFDbkRBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBRU5BLENBQUNBLEVBL0hNLE1BQU0sS0FBTixNQUFNLFFBK0haIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9saWJzL2hhd3Rpby11dGlsaXRpZXMvZGVmcy5kLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2xpYnMvaGF3dGlvLWt1YmVybmV0ZXMvZGVmcy5kLnRzXCIvPlxuXG5kZWNsYXJlIHZhciBUSFJFRTphbnk7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgdmFyIFcgPSAxO1xuICBleHBvcnQgdmFyIFMgPSAwO1xuICBleHBvcnQgdmFyIFdBTEwgPSBXO1xuICBleHBvcnQgdmFyIFNQQUNFID0gUztcblxuICBleHBvcnQgdmFyIENFTExfU0laRSA9IDEwMDtcbiAgZXhwb3J0IHZhciBGTE9PUl9MRVZFTCA9IC1DRUxMX1NJWkU7XG5cbiAgZXhwb3J0IGludGVyZmFjZSBSZW5kZXJhYmxlIHtcbiAgICByZW5kZXIoKTp2b2lkO1xuICAgIGRlc3Ryb3koKTp2b2lkO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBTY2VuZU9iamVjdCBleHRlbmRzIFJlbmRlcmFibGV7XG4gICAgZ2V0UG9zaXRpb24oKTphbnk7XG4gICAgc2V0UG9zaXRpb24oeCwgeSwgeik7XG4gICAgc2V0Um90YXRpb24ocngsIHJ5LCByeik7XG4gIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSW50ZXJmYWNlcy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9ICdLdWJlM2QnO1xuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQocGx1Z2luTmFtZSk7XG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gJ3BsdWdpbnMva3ViZTNkL2h0bWwnO1xuICBleHBvcnQgdmFyIGhhdmVQb2ludGVyTG9jayA9ICdwb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50IHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50IHx8ICd3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50O1xuXG5cbiAgZXhwb3J0IHZhciBIYWxmUEkgPSBNYXRoLlBJIC8gMjtcblxuICBleHBvcnQgZnVuY3Rpb24gcmdiVG9IZXgociwgZywgYikge1xuICAgIHJldHVybiBcIiNcIiArICgoMSA8PCAyNCkgKyAociA8PCAxNikgKyAoZyA8PCA4KSArIGIpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiByYW5kb21HcmV5KCkge1xuICAgIHZhciByZ2JWYWwgPSBNYXRoLnJhbmRvbSgpICogMTI4ICsgMTI4O1xuICAgIHJldHVybiByZ2JUb0hleChyZ2JWYWwsIHJnYlZhbCwgcmdiVmFsKTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiB3ZWJnbEF2YWlsYWJsZSgpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XG4gICAgICByZXR1cm4gISEoICg8YW55PndpbmRvdykuV2ViR0xSZW5kZXJpbmdDb250ZXh0ICYmIChcbiAgICAgICAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCAnd2ViZ2wnICkgfHxcbiAgICAgICAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJyApIClcbiAgICAgICAgICApO1xuICAgIH0gY2F0Y2ggKCBlICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBwbGFjZU9iamVjdChjZWxsWCwgY2VsbFksIGlzRmxvb3IgPSBmYWxzZSkge1xuICAgIHZhciB4ID0gY2VsbFggKiBDRUxMX1NJWkU7XG4gICAgdmFyIHogPSBjZWxsWSAqIENFTExfU0laRTtcbiAgICB2YXIgeSA9IGlzRmxvb3IgPyBGTE9PUl9MRVZFTCA6IDA7XG4gICAgcmV0dXJuIFt4LCB5LCB6XTtcbiAgfVxuXG5cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEhlbHBlcnMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCB2YXIgX21vZHVsZSA9IGFuZ3VsYXIubW9kdWxlKHBsdWdpbk5hbWUsIFtdKTtcbiAgZXhwb3J0IHZhciBjb250cm9sbGVyID0gUGx1Z2luSGVscGVycy5jcmVhdGVDb250cm9sbGVyRnVuY3Rpb24oX21vZHVsZSwgcGx1Z2luTmFtZSk7XG5cbiAgdmFyIHRhYiA9IHVuZGVmaW5lZDtcblxuICBfbW9kdWxlLmNvbmZpZyhbJyRyb3V0ZVByb3ZpZGVyJywgXCJIYXd0aW9OYXZCdWlsZGVyUHJvdmlkZXJcIiwgKCRyb3V0ZVByb3ZpZGVyOiBuZy5yb3V0ZS5JUm91dGVQcm92aWRlciwgYnVpbGRlcjogSGF3dGlvTWFpbk5hdi5CdWlsZGVyRmFjdG9yeSkgPT4ge1xuICAgIHRhYiA9IGJ1aWxkZXIuY3JlYXRlKClcbiAgICAgIC5pZChwbHVnaW5OYW1lKVxuICAgICAgLnRpdGxlKCgpID0+ICczRCBWaWV3JylcbiAgICAgIC5ocmVmKCgpID0+ICcva3ViZXJuZXRlcy8zZCcpXG4gICAgICAucGFnZSgoKSA9PiBidWlsZGVyLmpvaW4odGVtcGxhdGVQYXRoLCAndmlldy5odG1sJykpXG4gICAgICAuYnVpbGQoKTtcbiAgICBidWlsZGVyLmNvbmZpZ3VyZVJvdXRpbmcoJHJvdXRlUHJvdmlkZXIsIHRhYik7XG5cbiAgfV0pO1xuXG4gIF9tb2R1bGUucnVuKFsnSGF3dGlvTmF2JywgKG5hdikgPT4ge1xuICAgIG5hdi5vbihIYXd0aW9NYWluTmF2LkFjdGlvbnMuQURELCBwbHVnaW5OYW1lLCAoaXRlbSkgPT4ge1xuICAgICAgaWYgKGl0ZW0uaWQgIT09ICdrdWJlcm5ldGVzJykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIV8uYW55KGl0ZW0udGFicywgKHRhYjphbnkpID0+IHRhYi5pZCA9PT0gcGx1Z2luTmFtZSkpIHtcbiAgICAgICAgaXRlbS50YWJzLnB1c2godGFiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfV0pO1xuXG5cbiAgaGF3dGlvUGx1Z2luTG9hZGVyLmFkZE1vZHVsZShwbHVnaW5OYW1lKTtcblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZFBsdWdpbi50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoJ3JlcXVlc3RMb2NrJywgWyckZG9jdW1lbnQnLCAoJGRvY3VtZW50KSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBzY29wZToge1xuICAgICAgICAnb25Mb2NrJzogJyZyZXF1ZXN0TG9jaydcbiAgICAgIH0sXG4gICAgICBsaW5rOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpID0+IHtcbiAgICAgICAgdmFyIGVsID0gZWxlbWVudFswXSB8fCBlbGVtZW50O1xuICAgICAgICBpZiAoaGF2ZVBvaW50ZXJMb2NrKSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiaGVyZSFcIik7XG4gICAgICAgICAgdmFyIGRvYyA9ICRkb2N1bWVudFswXTtcbiAgICAgICAgICB2YXIgYm9keSA9IGRvYy5ib2R5O1xuXG4gICAgICAgICAgdmFyIHBvaW50ZXJsb2NrY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoIGRvYy5wb2ludGVyTG9ja0VsZW1lbnQgPT09IGJvZHkgfHwgXG4gICAgICAgICAgICAgICAgIGRvYy5tb3pQb2ludGVyTG9ja0VsZW1lbnQgPT09IGJvZHkgfHwgXG4gICAgICAgICAgICAgICAgIGRvYy53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQgPT09IGJvZHkgKSB7XG4gICAgICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgIHNjb3BlLm9uTG9jayh7IGxvY2s6IHRydWUgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICAgIHNjb3BlLm9uTG9jayh7IGxvY2s6IGZhbHNlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ29yZS4kYXBwbHkoc2NvcGUpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB2YXIgcG9pbnRlcmxvY2tlcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlICk7XG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSApO1xuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAnd2Via2l0cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UgKTtcblxuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlICk7XG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICdtb3pwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UgKTtcbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ3dlYmtpdHBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSApO1xuXG4gICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICBib2R5LnJlcXVlc3RQb2ludGVyTG9jayA9IGJvZHkucmVxdWVzdFBvaW50ZXJMb2NrIHx8IGJvZHkubW96UmVxdWVzdFBvaW50ZXJMb2NrIHx8IGJvZHkud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuICAgICAgICAgICAgYm9keS5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyBcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSW50ZXJmYWNlcy50c1wiLz5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdLdWJlM2QnKTtcblxuICBleHBvcnQgY2xhc3MgU2NlbmVPYmplY3RCYXNlIGltcGxlbWVudHMgU2NlbmVPYmplY3Qge1xuXG4gICAgcHJpdmF0ZSBib3VuZGluZ0JveDphbnkgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIHNjZW5lOmFueSwgcHVibGljIGdlb21ldHJ5OmFueSkge1xuICAgICAgdGhpcy5zY2VuZS5hZGQoZ2VvbWV0cnkpO1xuICAgICAgdGhpcy5ib3VuZGluZ0JveCA9IG5ldyBUSFJFRS5Cb3VuZGluZ0JveEhlbHBlcih0aGlzLmdlb21ldHJ5LCAweDAwZmYwMCk7XG4gICAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmJvdW5kaW5nQm94KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKHRoaXMuZ2VvbWV0cnkpO1xuICAgICAgdGhpcy5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICBkZWxldGUgdGhpcy5nZW9tZXRyeTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVidWcoZW5hYmxlKSB7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnZpc2libGUgPSBlbmFibGU7XG4gICAgfVxuXG4gICAgcHVibGljIG1vdmUoeCwgeSwgeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi54ICs9IHg7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnkgKz0geTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueiArPSB6O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi54ICs9IHg7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnkgKz0geTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueiArPSB6O1xuICAgIH1cblxuICAgIHB1YmxpYyByb3RhdGUocngsIHJ5LCByeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi54ICs9IHJ4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi55ICs9IHJ5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi56ICs9IHJ6O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5yb3RhdGlvbi54ICs9IHJ4O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5yb3RhdGlvbi55ICs9IHJ5O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5yb3RhdGlvbi56ICs9IHJ6O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQb3NpdGlvbigpIHtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gudXBkYXRlKCk7XG4gICAgICByZXR1cm4gdGhpcy5ib3VuZGluZ0JveC5vYmplY3QucG9zaXRpb247XG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHgsIHksIHopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueCA9IHg7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnkgPSB5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi56ID0gejtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueCA9IHg7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnkgPSB5O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi56ID0gejtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRSb3RhdGlvbihyeCwgcnksIHJ6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnggPSByeDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueSA9IHJ5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi56ID0gcno7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnggPSByeDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueSA9IHJ5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi56ID0gcno7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gudXBkYXRlKCk7XG4gICAgfVxuXG4gIH1cblxuICBleHBvcnQgY2xhc3MgUG9kT2JqZWN0IGV4dGVuZHMgU2NlbmVPYmplY3RCYXNlIHtcbiAgICBwcml2YXRlIGFuZ2xlOm51bWJlciA9IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIGNpcmNsZTphbnkgPSB1bmRlZmluZWQ7XG4gICAgcHJpdmF0ZSByb3RhdGlvbiA9IHtcbiAgICAgIHg6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwMCxcbiAgICAgIHk6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwLFxuICAgICAgejogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAwXG4gICAgfTtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgc2NlbmU6IGFueSwgcHVibGljIGhvc3RPYmplY3Q6SG9zdE9iamVjdCwgcHVibGljIGlkOnN0cmluZywgcHVibGljIG9iajphbnkpIHtcbiAgICAgIHN1cGVyKHNjZW5lLCBuZXcgVEhSRUUuT2JqZWN0M0QoKSk7XG4gICAgICB2YXIgdGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUob2JqLiRpY29uVXJsKTtcbiAgICAgIHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICAgIHRoaXMuZ2VvbWV0cnkuYWRkKFxuICAgICAgICAgIG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICAgICAgbmV3IFRIUkVFLkJveEdlb21ldHJ5KDUwLCA1MCwgNTApLCBcbiAgICAgICAgICAgIG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XG4gICAgICAgICAgICAgIGNvbG9yOiAweGZmZmZmZiwgXG4gICAgICAgICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgYnVtcE1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgY2FzdFNoYWRvdzogdHJ1ZSwgXG4gICAgICAgICAgICAgIHJlY2VpdmVTaGFkb3c6IHRydWUsIFxuICAgICAgICAgICAgICBzaGFkaW5nOiBUSFJFRS5TbW9vdGhTaGFkaW5nXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSk7XG4gICAgICBsb2cuZGVidWcoXCJDcmVhdGVkIHBvZCBvYmplY3QgXCIsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlKG1vZGVsLCBwb2QpIHtcbiAgICAgIHRoaXMub2JqID0gcG9kO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgICAgdGhpcy5ob3N0T2JqZWN0Lmdlb21ldHJ5LnJlbW92ZSh0aGlzLmNpcmNsZSk7XG4gICAgICBsb2cuZGVidWcoXCJEZXN0cm95ZWQgcG9kIG9iamVjdCBcIiwgdGhpcy5pZCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkaXN0YW5jZSgpIHtcbiAgICAgIHZhciBob3N0UG9zaXRpb24gPSB0aGlzLmhvc3RPYmplY3QuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBteVBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIGRpc3RYID0gTWF0aC5hYnMoaG9zdFBvc2l0aW9uLnggLSBteVBvc2l0aW9uLngpO1xuICAgICAgdmFyIGRpc3RZID0gTWF0aC5hYnMoaG9zdFBvc2l0aW9uLnkgLSBteVBvc2l0aW9uLnkpO1xuICAgICAgcmV0dXJuIE1hdGguc3FydChkaXN0WCAqIGRpc3RYICsgZGlzdFkgKiBkaXN0WSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhbmdsZU9mVmVsb2NpdHkoKSB7XG4gICAgICBpZiAoIXRoaXMuYW5nbGUpIHtcbiAgICAgICAgdmFyIGRpc3QgPSB0aGlzLmRpc3RhbmNlKCk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcInBvZCBpZDogXCIsIHRoaXMuaWQsIFwiIGRpc3RhbmNlOiBcIiwgZGlzdCk7XG4gICAgICAgIHRoaXMuYW5nbGUgPSAoMSAvIGRpc3QpICogMTA7XG4gICAgICAgIGxvZy5kZWJ1ZyhcInBvZCBpZDogXCIsIHRoaXMuaWQsIFwiIGFuZ2xlOiBcIiwgdGhpcy5hbmdsZSk7XG4gICAgICAgIHZhciBtYXRlcmlhbEFycmF5ID0gW107XG4gICAgICAgIHZhciBmYWNlID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHsgXG4gICAgICAgICAgY29sb3I6IDB4NTU1NTU1LFxuICAgICAgICAgIGNhc3RTaGFkb3c6IHRydWUsXG4gICAgICAgICAgcmVjZWl2ZVNoYWRvdzogdHJ1ZSxcbiAgICAgICAgICB3aXJlZnJhbWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGVyaWFsQXJyYXkucHVzaChmYWNlLmNsb25lKCkpO1xuICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2goZmFjZS5jbG9uZSgpKTtcbiAgICAgICAgdGhpcy5jaXJjbGUgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuUmluZ0dlb21ldHJ5KGRpc3QgLSAxLCBkaXN0ICsgMSwgMTI4KSwgbmV3IFRIUkVFLk1lc2hGYWNlTWF0ZXJpYWwobWF0ZXJpYWxBcnJheSkpO1xuICAgICAgICB0aGlzLmhvc3RPYmplY3QuZ2VvbWV0cnkuYWRkKHRoaXMuY2lyY2xlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFuZ2xlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICB2YXIgbXlQb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBob3N0UG9zaXRpb24gPSB0aGlzLmhvc3RPYmplY3QuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciB4ID0gbXlQb3NpdGlvbi54O1xuICAgICAgdmFyIHkgPSBteVBvc2l0aW9uLnk7XG4gICAgICB2YXIgY2VudGVyWCA9IGhvc3RQb3NpdGlvbi54O1xuICAgICAgdmFyIGNlbnRlclkgPSBob3N0UG9zaXRpb24ueTtcbiAgICAgIHZhciBvZmZzZXRYID0geCAtIGNlbnRlclg7XG4gICAgICB2YXIgb2Zmc2V0WSA9IHkgLSBjZW50ZXJZO1xuICAgICAgdmFyIGFuZ2xlID0gdGhpcy5hbmdsZU9mVmVsb2NpdHkoKTtcbiAgICAgIHZhciBuZXdYID0gY2VudGVyWCArIG9mZnNldFggKiBNYXRoLmNvcyhhbmdsZSkgLSBvZmZzZXRZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmFyIG5ld1kgPSBjZW50ZXJZICsgb2Zmc2V0WCAqIE1hdGguc2luKGFuZ2xlKSArIG9mZnNldFkgKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICB0aGlzLnNldFBvc2l0aW9uKG5ld1gsIG5ld1ksIDApO1xuICAgICAgdGhpcy5yb3RhdGUodGhpcy5yb3RhdGlvbi54LCB0aGlzLnJvdGF0aW9uLnksIHRoaXMucm90YXRpb24ueik7XG4gICAgICBzdXBlci5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICBleHBvcnQgY2xhc3MgSG9zdE9iamVjdCBleHRlbmRzIFNjZW5lT2JqZWN0QmFzZSB7XG4gICAgcHJpdmF0ZSBvZmZzZXRYID0gMjAwO1xuICAgIHByaXZhdGUgb2Zmc2V0WSA9IDIwMDtcbiAgICBwdWJsaWMgcG9kcyA9IHt9O1xuICAgIHB1YmxpYyByb3RhdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgICAgejogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAwXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3Ioc2NlbmU6IGFueSwgcHVibGljIGlkOnN0cmluZywgcHVibGljIG9iajphbnkpIHtcbiAgICAgIHN1cGVyKHNjZW5lLCBuZXcgVEhSRUUuT2JqZWN0M0QoKSlcbiAgICAgIHZhciB0ZXh0dXJlID0gVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1nL3N1bi10ZXh0dXJlLmpwZycpO1xuICAgICAgdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICAgICAgdGhpcy5nZW9tZXRyeS5hZGQoIFxuICAgICAgICAgIG5ldyBUSFJFRS5Qb2ludExpZ2h0KDB4ZmZkNzAwLCAxLCA1MDAwKSxcbiAgICAgICAgICBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgICAgIG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgxMDAsIDMyLCAxNiksIFxuICAgICAgICAgICAgbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICAgICAgICAgICAgY29sb3I6IDB4ZmZkNzAwLCBcbiAgICAgICAgICAgICAgbWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBidW1wTWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBzcGVjdWxhcjogMHgwMGZmMDAsIFxuICAgICAgICAgICAgICBzaGFkaW5nOiBUSFJFRS5TbW9vdGhTaGFkaW5nXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkNyZWF0ZWQgaG9zdCBvYmplY3QgXCIsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlKG1vZGVsLCBob3N0KSB7XG4gICAgICB0aGlzLm9iaiA9IGhvc3Q7XG4gICAgICB2YXIgcG9kc1RvUmVtb3ZlID0gW107XG4gICAgICBfLmZvckluKHRoaXMucG9kcywgKHBvZCwga2V5KSA9PiB7XG4gICAgICAgIGlmICghKGtleSBpbiBtb2RlbC5wb2RzQnlLZXkpKSB7XG4gICAgICAgICAgcG9kc1RvUmVtb3ZlLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBfLmZvckVhY2gocG9kc1RvUmVtb3ZlLCAoaWQpID0+IHRoaXMucmVtb3ZlUG9kKGlkKSk7XG4gICAgICBfLmZvckVhY2godGhpcy5vYmoucG9kcywgKHBvZDphbnkpID0+IHtcbiAgICAgICAgdmFyIG5hbWUgPSBwb2QuX2tleTtcbiAgICAgICAgaWYgKCF0aGlzLmhhc1BvZChuYW1lKSkge1xuICAgICAgICAgIHRoaXMuYWRkUG9kKG5hbWUsIHBvZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHBvZE9iaiA9IHRoaXMucG9kc1tuYW1lXTtcbiAgICAgICAgICBwb2RPYmoudXBkYXRlKG1vZGVsLCBwb2QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVidWcoZW5hYmxlKSB7XG4gICAgICB2YXIgaWRzID0gXy5rZXlzKHRoaXMucG9kcylcbiAgICAgIF8uZm9yRWFjaChpZHMsIChpZCkgPT4gdGhpcy5wb2RzW2lkXS5kZWJ1ZyhlbmFibGUpKTtcbiAgICAgIHN1cGVyLmRlYnVnKGVuYWJsZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICBpZiAodGhpcy5wb2RzKSB7XG4gICAgICAgIHZhciBwb2RJZHMgPSBfLmtleXModGhpcy5wb2RzKTtcbiAgICAgICAgXy5mb3JFYWNoKHBvZElkcywgKGlkKSA9PiB0aGlzLnJlbW92ZVBvZChpZCkpO1xuICAgICAgfVxuICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgICAgbG9nLmRlYnVnKFwiRGVzdHJveWluZyBob3N0IG9iamVjdCBcIiwgdGhpcy5pZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVBvZChpZCkge1xuICAgICAgdmFyIHBvZCA9IHRoaXMucG9kc1tpZF07XG4gICAgICBpZiAocG9kKSB7XG4gICAgICAgIHBvZC5kZXN0cm95KCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnBvZHNbaWRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRQb2Qoa2V5LCBwOmFueSkge1xuICAgICAgaWYgKHRoaXMuaGFzUG9kKGtleSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG15UG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgcG9kT2Zmc2V0WCA9IHRoaXMub2Zmc2V0WCAtIG15UG9zaXRpb24ueDtcbiAgICAgIHZhciBwb2RPZmZzZXRZID0gbXlQb3NpdGlvbi55O1xuICAgICAgLypcbiAgICAgIHZhciBhbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gICAgICB2YXIgcG9kWCA9IG15UG9zaXRpb24ueCArIHBvZE9mZnNldFggKiBNYXRoLmNvcyhhbmdsZSkgLSBwb2RPZmZzZXRZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmFyIHBvZFkgPSBteVBvc2l0aW9uLnkgKyBwb2RPZmZzZXRYICogTWF0aC5zaW4oYW5nbGUpIC0gcG9kT2Zmc2V0WSAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICovXG4gICAgICB2YXIgcG9kID0gbmV3IFBvZE9iamVjdCh0aGlzLnNjZW5lLCB0aGlzLCBrZXksIHApO1xuICAgICAgcG9kLnNldFBvc2l0aW9uKG15UG9zaXRpb24ueCwgbXlQb3NpdGlvbi55LCBteVBvc2l0aW9uLnopO1xuICAgICAgcG9kLm1vdmUodGhpcy5vZmZzZXRYLCAwLCAwKTtcbiAgICAgIHRoaXMub2Zmc2V0WCA9IHRoaXMub2Zmc2V0WCArIE1hdGgucmFuZG9tKCkgKiA1MCArIDEwMDtcbiAgICAgIHRoaXMub2Zmc2V0WSA9IHRoaXMub2Zmc2V0WSArIE1hdGgucmFuZG9tKCkgKiA1MCArIDEwMDtcbiAgICAgIHRoaXMucG9kc1trZXldID0gcG9kO1xuICAgIH1cblxuICAgIHB1YmxpYyBoYXNQb2QoaWQpIHtcbiAgICAgIHJldHVybiAoaWQgaW4gdGhpcy5wb2RzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0ZXAgPSAwO1xuICAgIFxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICB0aGlzLnJvdGF0ZSh0aGlzLnJvdGF0aW9uLngsIHRoaXMucm90YXRpb24ueSwgdGhpcy5yb3RhdGlvbi56KTtcbiAgICAgIF8uZm9ySW4odGhpcy5wb2RzLCAocG9kT2JqZWN0LCBpZCkgPT4ge1xuICAgICAgICBwb2RPYmplY3QucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuc3RlcCA9IHRoaXMuc3RlcCArIDE7XG4gICAgICBzdXBlci5yZW5kZXIoKTtcbiAgICB9XG5cblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RIZWxwZXJzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICB2YXIgbGV2ZWxEYXRhID0gXG4gICAgW1xuICAgICAgWyBXLCBXLCBXLCBXLCBXLCBXLCBXLCBXIF0sXG4gICAgICBbIFcsIFMsIFMsIFMsIFMsIFMsIFMsIFcgXSxcbiAgICAgIFsgVywgUywgUywgUywgUywgUywgUywgVyBdLFxuICAgICAgWyBXLCBTLCBTLCBTLCBTLCBTLCBTLCBXIF0sXG4gICAgICBbIFcsIFMsIFMsIFMsIFMsIFMsIFMsIFcgXSxcbiAgICAgIFsgVywgUywgUywgUywgUywgUywgUywgVyBdLFxuICAgICAgWyBXLCBTLCBTLCBTLCBTLCBTLCBTLCBXIF0sXG4gICAgICBbIFcsIFcsIFcsIFcsIFcsIFcsIFcsIFcgXVxuICAgIF07XG5cbiAgdmFyIGxldmVsV2lkdGggPSBsZXZlbERhdGFbMF0ubGVuZ3RoO1xuICB2YXIgbGV2ZWxIZWlnaHQgPSBsZXZlbERhdGEubGVuZ3RoO1xuXG4gIHZhciB3YWxsVGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltZy9JTUdQMTQ1MC5qcGcnKTtcbiAgd2FsbFRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgdmFyIHdhbGxNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XG4gICAgY29sb3I6IDB4MDBmZjAwLCBcbiAgICBtYXA6IHdhbGxUZXh0dXJlLFxuICAgIHdpcmVmcmFtZTogZmFsc2VcbiAgfSk7XG4gIHZhciB3YWxsID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLkJveEdlb21ldHJ5KENFTExfU0laRSwgQ0VMTF9TSVpFLCBDRUxMX1NJWkUpLCB3YWxsTWF0ZXJpYWwpO1xuXG4gIHZhciBmbG9vclRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdpbWcvSU1HUDE0NTAuanBnJyk7XG4gIGZsb29yVGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICB2YXIgZmxvb3JNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XG4gICAgY29sb3I6IDB4ZmYwMDAwLCBcbiAgICBtYXA6IGZsb29yVGV4dHVyZSxcbiAgICB3aXJlZnJhbWU6IGZhbHNlXG4gIH0pO1xuICB2YXIgZmxvb3IgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoQ0VMTF9TSVpFLCBDRUxMX1NJWkUsIENFTExfU0laRSksIGZsb29yTWF0ZXJpYWwpO1xuXG4gIGZ1bmN0aW9uIG1ha2VCb3goY2VsbFgsIGNlbGxZLCBpc0Zsb29yID0gZmFsc2UpIHtcbiAgICB2YXIgYm94ID0gaXNGbG9vciA/IGZsb29yLmNsb25lKCkgOiB3YWxsLmNsb25lKCk7XG4gICAgYm94LnBvc2l0aW9uLmZyb21BcnJheShwbGFjZU9iamVjdChjZWxsWCwgY2VsbFksIGlzRmxvb3IpKTtcbiAgICByZXR1cm4gYm94O1xuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFdvcmxkIGltcGxlbWVudHMgUmVuZGVyYWJsZSB7XG4gICAgcHJpdmF0ZSBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCggMHhmZmZmZmYgKTtcbiAgICBwcml2YXRlIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ODg4ODg4ICk7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBzY2VuZSkge1xuICAgICAgdGhpcy5hbWJpZW50LmNvbG9yLnNldEhTTCggMC4xLCAwLjMsIDAuMiApO1xuICAgICAgdGhpcy5saWdodC5wb3NpdGlvbi5zZXQoIDEsIDEsIDApO1xuICAgICAgLy9zY2VuZS5mb2cgPSBuZXcgVEhSRUUuRm9nKDB4ZmZmZmZmLCA1MDAsIDEwMDAwKVxuICAgICAgc2NlbmUuYWRkKHRoaXMuYW1iaWVudCk7XG4gICAgICBzY2VuZS5hZGQodGhpcy5saWdodCk7XG5cbiAgICAgIC8vIHNreWJveFxuICAgICAgdmFyIG1hdGVyaWFsQXJyYXkgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNjsgaSsrKVxuICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2gobmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICBtYXA6IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltZy9zcGFjZS1zZWFtbGVzcy5wbmcnKSxcbiAgICAgICAgICBzaWRlOiBUSFJFRS5CYWNrU2lkZVxuICAgICAgICB9KSk7XG4gICAgICB2YXIgc2t5TWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEZhY2VNYXRlcmlhbChtYXRlcmlhbEFycmF5KTtcbiAgICAgIHNjZW5lLmFkZChuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoMTAwMDAsIDEwMDAwLCAxMDAwMCksIHNreU1hdGVyaWFsKSk7XG5cbiAgICAgIC8vIHdhbGxzL2Zsb29yXG4gICAgICBfLmZvckVhY2gobGV2ZWxEYXRhLCAocm93LCB5KSA9PiB7XG4gICAgICAgIF8uZm9yRWFjaChyb3csIChjZWxsLCB4KSA9PiB7XG4gICAgICAgICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICAgICAgICBjYXNlIFdBTEw6XG4gICAgICAgICAgICAgIHNjZW5lLmFkZChtYWtlQm94KHgsIHksIGZhbHNlKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzY2VuZS5hZGQobWFrZUJveCh4LCB5LCB0cnVlKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8qXG4gICAgICAvLyBwYXJ0aWNsZSBjbG91ZFxuICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwMDAwOyBpKyspIHtcbiAgICAgICAgdmFyIHZlcnRleCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgICAgIHZlcnRleC54ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIHZlcnRleC55ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIHZlcnRleC56ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGV4KTtcbiAgICAgIH1cbiAgICAgIHZhciBwYXJ0aWNsZXMgPSBuZXcgVEhSRUUuUG9pbnRDbG91ZCggZ2VvbWV0cnksIG5ldyBUSFJFRS5Qb2ludENsb3VkTWF0ZXJpYWwoe2NvbG9yOiAweDg4ODg4OCwgZm9nOiB0cnVlfSkpO1xuICAgICAgc2NlbmUuYWRkKHBhcnRpY2xlcyk7XG4gICAgICAqL1xuICAgIH1cblxuICAgIHB1YmxpYyBwbGFjZVBsYXllcihvYmplY3QpIHtcbiAgICAgIHRoaXMucGxhY2VPYmplY3Qob2JqZWN0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcGxhY2VPYmplY3Qob2JqZWN0KSB7XG4gICAgICBpZiAoIW9iamVjdCB8fCAhb2JqZWN0LnBvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciB4LCB5O1xuICAgICAgZG8ge1xuICAgICAgICB4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGxldmVsV2lkdGggLSAyKSArIDEpO1xuICAgICAgICB5ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGxldmVsSGVpZ2h0IC0yKSArIDEpO1xuICAgICAgICBsb2cuZGVidWcoXCJ4OlwiLHgsXCJ5OlwiLHksXCJ2YWw6XCIsbGV2ZWxEYXRhW3ldW3hdKTtcbiAgICAgIH0gd2hpbGUgKGxldmVsRGF0YVt5XVt4XSAhPT0gU1BBQ0UpXG4gICAgICBvYmplY3QucG9zaXRpb24uZnJvbUFycmF5KHBsYWNlT2JqZWN0KHgsIHkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG5cbiAgICB9XG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSGVscGVycy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ3b3JsZC50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IGNsYXNzIFBsYXllciBpbXBsZW1lbnRzIFJlbmRlcmFibGUge1xuICAgIHByaXZhdGUgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgna3ViZTNkLXBsYXllcicpO1xuICAgIHByaXZhdGUgZG9tRWxlbWVudDphbnkgPSBudWxsO1xuICAgIHByaXZhdGUgX2xvb2tBdDphbnkgPSBudWxsO1xuICAgIHByaXZhdGUgcGl0Y2ggPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICBwcml2YXRlIHlhdyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgcHJpdmF0ZSBfZW5hYmxlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2RvY3VtZW50ID0gdW5kZWZpbmVkO1xuXG4gICAgcHJpdmF0ZSBnZXRXb3JsZE9iamVjdHM6YW55ID0gKCkgPT4gW107XG5cbiAgICBwcml2YXRlIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIobmV3IFRIUkVFLlZlY3RvcjMoKSwgbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApLCAwLCAxMCk7XG5cbiAgICAvLyBtb3ZlbWVudCBib29sZWFuc1xuICAgIHByaXZhdGUgZm9yd2FyZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgYmFja3dhcmQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGxlZnQgPSBmYWxzZTtcbiAgICBwcml2YXRlIHJpZ2h0ID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBjYW5KdW1wID0gdHJ1ZTtcblxuICAgIC8vIG1vdmVtZW50IHZlbG9jaXR5XG4gICAgcHJpdmF0ZSB2ZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBwcmV2VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8ga2V5L21vdXNlIGhhbmRsZXJzXG4gICAgcHJpdmF0ZSBoYW5kbGVyczphbnkgPSBudWxsO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgc2NlbmUsIHByaXZhdGUgY2FtZXJhLCBwcml2YXRlIGQsIHByaXZhdGUgd29ybGQ6V29ybGQpIHtcblxuICAgICAgY2FtZXJhLnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICB0aGlzLnBpdGNoLmFkZChjYW1lcmEpO1xuICAgICAgdGhpcy55YXcuYWRkKHRoaXMucGl0Y2gpO1xuICAgICAgc2NlbmUuYWRkKHRoaXMueWF3KTtcblxuICAgICAgdGhpcy55YXcucG9zaXRpb24uc2V0KDAsIDAsIC01KTtcblxuICAgICAgdmFyIGRvbUVsZW1lbnQgPSB0aGlzLmRvbUVsZW1lbnQgPSAkKGQpO1xuXG4gICAgICBpZiAoIWhhdmVQb2ludGVyTG9jaykge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYuaGFuZGxlcnMgPSB7XG4gICAgICAgICdrZXlkb3duJzogKGV2ZW50OmFueSkgPT4ge1xuICAgICAgICAgIHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG4gICAgICAgICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICAgICAgICBzZWxmLmZvcndhcmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgICAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgICAgICAgc2VsZi5sZWZ0ID0gdHJ1ZTsgXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICAgICAgICBzZWxmLmJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICAgICAgICBzZWxmLnJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICAgICAgICBpZiAoc2VsZi5jYW5KdW1wID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52ZWxvY2l0eS55ICs9IDM1MDtcbiAgICAgICAgICAgICAgICBzZWxmLmNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICdrZXl1cCc6IChldmVudDphbnkpID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKCBldmVudC5rZXlDb2RlICkge1xuICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgICAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgICAgICAgc2VsZi5mb3J3YXJkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICAgICAgICBzZWxmLmxlZnQgPSBmYWxzZTsgXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICAgICAgICBzZWxmLmJhY2t3YXJkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgICAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgICAgICAgc2VsZi5yaWdodCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICdtb3VzZW1vdmUnOiAoZXZlbnQ6YW55KSA9PiB7XG4gICAgICAgICAgaWYgKCFzZWxmLl9lbmFibGVkIHx8ICFoYXZlUG9pbnRlckxvY2spIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHlhdyA9IHNlbGYueWF3O1xuICAgICAgICAgIHZhciBwaXRjaCA9IHNlbGYucGl0Y2g7XG4gICAgICAgICAgdmFyIGRlbHRhWCA9IGV2ZW50Lm1vdmVtZW50WCB8fCBldmVudC5tb3pNb3ZlbWVudFggfHwgZXZlbnQud2Via2l0TW92ZW1lbnRYIHx8IDA7XG4gICAgICAgICAgdmFyIGRlbHRhWSA9IGV2ZW50Lm1vdmVtZW50WSB8fCBldmVudC5tb3pNb3ZlbWVudFggfHwgZXZlbnQud2Via2l0TW92ZW1lbnRYIHx8IDA7XG4gICAgICAgICAgeWF3LnJvdGF0aW9uLnkgLT0gZGVsdGFYICogMC4wMDI7XG4gICAgICAgICAgcGl0Y2gucm90YXRpb24ueCAtPSBkZWx0YVkgKiAwLjAwMjtcbiAgICAgICAgICBwaXRjaC5yb3RhdGlvbi54ID0gTWF0aC5tYXgoLUhhbGZQSSwgTWF0aC5taW4oSGFsZlBJLCBwaXRjaC5yb3RhdGlvbi54KSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBfLmZvckluKHRoaXMuaGFuZGxlcnMsIChoYW5kbGVyLCBldnQpID0+IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZ0LCBoYW5kbGVyLCBmYWxzZSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgZW5hYmxlZChlbmFibGVkKSB7XG4gICAgICB0aGlzLl9lbmFibGVkID0gZW5hYmxlZDtcbiAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgIHRoaXMuY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy5jYW1lcmEucm90YXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLm9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMud29ybGQucGxhY2VQbGF5ZXIodGhpcy5vYmplY3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy55YXcucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLnlhdy5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMucGl0Y2gucm90YXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFdvcmxkT2JqZWN0c0NhbGxiYWNrKGZ1bmMpIHtcbiAgICAgIHRoaXMuZ2V0V29ybGRPYmplY3RzID0gZnVuYztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGVuYWJsZWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IG9iamVjdCgpIHtcbiAgICAgIHJldHVybiB0aGlzLnlhdztcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9va0F0KGJveCkge1xuICAgICAgdGhpcy5fbG9va0F0ID0gYm94O1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy55YXcpO1xuICAgICAgdGhpcy55YXcuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5waXRjaC5kaXNwb3NlKCk7XG4gICAgICBfLmZvckluKHRoaXMuaGFuZGxlcnMsIChoYW5kbGVyLCBldnQpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZ0LCBoYW5kbGVyKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIGlmICghdGhpcy5lbmFibGVkIHx8ICFoYXZlUG9pbnRlckxvY2spIHtcbiAgICAgICAgaWYgKHRoaXMuX2xvb2tBdCkge1xuICAgICAgICAgIHZhciBhbmdsZSA9IERhdGUubm93KCkgKiAwLjAwMDE7XG4gICAgICAgICAgdGhpcy5jYW1lcmEuZm9jdXModGhpcy5fbG9va0F0LCBhbmdsZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmF5Y2FzdGVyID0gdGhpcy5yYXljYXN0ZXI7XG4gICAgICB2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5O1xuICAgICAgdmFyIG1lID0gdGhpcy5vYmplY3Q7XG5cbiAgICAgIHJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkoIHRoaXMueWF3LnBvc2l0aW9uICk7XG4gICAgICByYXljYXN0ZXIucmF5Lm9yaWdpbi55IC09IDEwO1xuXG4gICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuZ2V0V29ybGRPYmplY3RzKCk7XG5cbiAgICAgIHZhciBpbnRlcnNlY3Rpb25zID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cyk7XG5cbiAgICAgIHZhciBpc09uT2JqZWN0ID0gaW50ZXJzZWN0aW9ucy5sZW5ndGggPiAwO1xuXG4gICAgICB2YXIgdGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgdmFyIGRlbHRhID0gKCB0aW1lIC0gdGhpcy5wcmV2VGltZSApIC8gMTAwMDtcblxuICAgICAgdmVsb2NpdHkueCAtPSB2ZWxvY2l0eS54ICogMTAuMCAqIGRlbHRhO1xuICAgICAgdmVsb2NpdHkueiAtPSB2ZWxvY2l0eS56ICogMTAuMCAqIGRlbHRhO1xuXG4gICAgICB2ZWxvY2l0eS55IC09IDkuOCAqIDEwMC4wICogZGVsdGE7IC8vIDEwMC4wID0gbWFzc1xuXG4gICAgICBpZiAodGhpcy5mb3J3YXJkKSB2ZWxvY2l0eS56IC09IDQwMC4wICogZGVsdGE7XG4gICAgICBpZiAodGhpcy5iYWNrd2FyZCkgdmVsb2NpdHkueiArPSA0MDAuMCAqIGRlbHRhO1xuICAgICAgaWYgKHRoaXMubGVmdCkgdmVsb2NpdHkueCAtPSA0MDAuMCAqIGRlbHRhO1xuICAgICAgaWYgKHRoaXMucmlnaHQpIHZlbG9jaXR5LnggKz0gNDAwLjAgKiBkZWx0YTtcblxuICAgICAgaWYgKCBpc09uT2JqZWN0ID09PSB0cnVlICkge1xuICAgICAgICB2ZWxvY2l0eS55ID0gTWF0aC5tYXgoIDAsIHZlbG9jaXR5LnkgKTtcbiAgICAgICAgdGhpcy5jYW5KdW1wID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgbWUudHJhbnNsYXRlWCggdmVsb2NpdHkueCAqIGRlbHRhICk7XG4gICAgICBtZS50cmFuc2xhdGVZKCB2ZWxvY2l0eS55ICogZGVsdGEgKTtcbiAgICAgIG1lLnRyYW5zbGF0ZVooIHZlbG9jaXR5LnogKiBkZWx0YSApO1xuXG4gICAgICBpZiAoIG1lLnBvc2l0aW9uLnkgPCAxMCApIHtcblxuICAgICAgICB2ZWxvY2l0eS55ID0gMDtcbiAgICAgICAgbWUucG9zaXRpb24ueSA9IDEwO1xuICAgICAgICB0aGlzLmNhbkp1bXAgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICB9XG4gIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIHZhciBkaXJlY3RpdmVOYW1lID0gJ3RocmVlanMnO1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKGRpcmVjdGl2ZU5hbWUsIFsoKSA9PiB7XG4gICAgVEhSRUUuSW1hZ2VVdGlscy5jcm9zc09yaWdpbiA9ICcnO1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIGNvbmZpZzogJz0/JyArIGRpcmVjdGl2ZU5hbWVcbiAgICAgIH0sXG4gICAgICBsaW5rOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSA9PiB7XG5cbiAgICAgICAgdmFyIHNjZW5lOmFueSA9IG51bGw7XG4gICAgICAgIHZhciBjYW1lcmE6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIHJlbmRlcmVyOmFueSA9IG51bGw7XG4gICAgICAgIHZhciBrZWVwUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgdmFyIHJlc2l6ZUhhbmRsZTphbnkgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAga2VlcFJlbmRlcmluZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCByZXNpemVGdW5jKTtcbiAgICAgICAgICBkZWxldGUgcmVuZGVyZXI7XG4gICAgICAgICAgZGVsZXRlIGNhbWVyYTtcbiAgICAgICAgICBkZWxldGUgc2NlbmU7XG4gICAgICAgICAgZWxlbWVudC5lbXB0eSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc2l6ZUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJyZXNpemluZ1wiKTtcbiAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnY2FudmFzJykud2lkdGgoZWxlbWVudC53aWR0aCgpKS5oZWlnaHQoZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgICAgICBjYW1lcmEuYXNwZWN0ID0gZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTaXplKGVsZW1lbnQud2lkdGgoKSwgZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50Lm9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgbG9nLmRlYnVnKFwic2NlbmUgZGVzdHJveWVkXCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzY29wZS4kd2F0Y2goJ2NvbmZpZycsIChjb25maWcpID0+IHtcbiAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgaWYgKCFjb25maWcgfHwgIWNvbmZpZy5pbml0aWFsaXplKSB7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJubyBjb25maWcsIHJldHVybmluZ1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gZW1lcmdlbmN5IHZldFxuICAgICAgICAgIC8vIDYwMy0yMjctMTE5OVxuICAgICAgICAgIGxvZy5kZWJ1ZyhcImNyZWF0aW5nIHNjZW5lXCIpO1xuICAgICAgICAgIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgICAgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDYwLCBlbGVtZW50LndpZHRoKCkgLyBlbGVtZW50LmhlaWdodCgpLCAwLjEsIDIwMDAwKTtcblxuICAgICAgICAgIGNhbWVyYS5mb2N1cyA9IChib3gzOmFueSwgYW5nbGUsIGM6YW55ID0gY2FtZXJhKSA9PiB7XG4gICAgICAgICAgICAvLyBhZGp1c3QgdGhlIGMgcG9zaXRpb24gdG8ga2VlcCBldmVyeXRoaW5nIGluIHZpZXcsIHdlJ2xsIGRvXG4gICAgICAgICAgICAvLyBncmFkdWFsIGFkanVzdG1lbnRzIHRob3VnaFxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGJveDMuc2l6ZSgpLnk7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSBib3gzLnNpemUoKS54IC8gKGNhbWVyYS5hc3BlY3QgLyAyKTtcbiAgICAgICAgICAgIC8vbG9nLmRlYnVnKFwid2lkdGg6XCIsIHdpZHRoLCBcIiBoZWlnaHQ6XCIsIGhlaWdodCk7XG4gICAgICAgICAgICBpZiAod2lkdGggPCAwIHx8IGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGRpc3RZID0gTWF0aC5yb3VuZChoZWlnaHQgKiBNYXRoLnRhbiggKGNhbWVyYS5mb3YgLyAyICkgKiAoIE1hdGguUEkgLyAxODAgKSkpO1xuICAgICAgICAgICAgdmFyIGRpc3RYID0gTWF0aC5yb3VuZCh3aWR0aCAqIE1hdGgudGFuKCAoY2FtZXJhLmZvdiAvIDIgKSAqICggTWF0aC5QSSAvIDE4MCApKSk7XG4gICAgICAgICAgICB2YXIgZGlzdFogPSAoZGlzdFkgKyBkaXN0WCk7XG4gICAgICAgICAgICAvLyBsb2cuZGVidWcoXCJkaXN0WTpcIiwgZGlzdFksIFwiIGRpc3RYOlwiLCBkaXN0WCwgXCJkaXN0WjpcIiwgZGlzdFopO1xuICAgICAgICAgICAgdmFyIHogPSBNYXRoLnJvdW5kKGMucG9zaXRpb24ueik7XG4gICAgICAgICAgICB2YXIgcGVyaW9kID0gNS4wO1xuICAgICAgICAgICAgYy5wb3NpdGlvbi54ID0gZGlzdFggKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgICAgICBjLnBvc2l0aW9uLnkgPSBkaXN0WSAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgICAgIGlmICh6ICE9PSBkaXN0Wikge1xuICAgICAgICAgICAgICBpZiAoeiA+IGRpc3RaKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSAoeiAtIGRpc3RaKSAvIHBlcmlvZDtcbiAgICAgICAgICAgICAgICBjLnBvc2l0aW9uLnogPSB6IC0gdjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoeiA8IGRpc3RaKSB7XG4gICAgICAgICAgICAgICAgdmFyIHYgPSAoZGlzdFogLSB6KSAvIHBlcmlvZDtcbiAgICAgICAgICAgICAgICBjLnBvc2l0aW9uLnogPSB6ICsgdjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYy5sb29rQXQoYm94My5jZW50ZXIoKSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmICggd2ViZ2xBdmFpbGFibGUoKSApIHtcbiAgICAgICAgICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuQ2FudmFzUmVuZGVyZXIoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy9yZW5kZXJlci5zZXRDbGVhckNvbG9yKDB4ZmZmZmZmKTtcbiAgICAgICAgICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKTtcbiAgICAgICAgICByZW5kZXJlci5zZXRTaXplKGVsZW1lbnQud2lkdGgoKSwgZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgICAgdmFyIGRvbUVsZW1lbnQgPSByZW5kZXJlci5kb21FbGVtZW50O1xuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKGRvbUVsZW1lbnQpO1xuXG4gICAgICAgICAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCByZXNpemVGdW5jKTtcbiAgICAgICAgICBjb25maWcuaW5pdGlhbGl6ZShyZW5kZXJlciwgc2NlbmUsIGNhbWVyYSwgZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFrZWVwUmVuZGVyaW5nKSB7XG4gICAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgICAgICAgICBpZiAoY29uZmlnLnJlbmRlcikge1xuICAgICAgICAgICAgICBjb25maWcucmVuZGVyKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2VlcFJlbmRlcmluZyA9IHRydWU7XG4gICAgICAgICAgcmVuZGVyKCk7XG5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfV0pO1xuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkUGx1Z2luLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInBsYXllci50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ3b3JsZC50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJvYmplY3RzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgdmFyIFZpZXdDb250cm9sbGVyID0gY29udHJvbGxlcignVmlld0NvbnRyb2xsZXInLCBbJyRzY29wZScsICdLdWJlcm5ldGVzTW9kZWwnLCAnS3ViZXJuZXRlc1N0YXRlJywgJyRlbGVtZW50JywgKCRzY29wZSwgbW9kZWw6S3ViZXJuZXRlcy5LdWJlcm5ldGVzTW9kZWxTZXJ2aWNlLCBzdGF0ZSwgJGVsZW1lbnQpID0+IHtcblxuICAgIHZhciBkZWJ1Z1NjZW5lID0gZmFsc2U7XG5cbiAgICB2YXIgcmVuZGVyZXI6YW55ID0gdW5kZWZpbmVkO1xuICAgIHZhciBzY2VuZTphbnkgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGNhbWVyYTphbnkgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGRvbUVsZW1lbnQ6YW55ID0gdW5kZWZpbmVkO1xuXG4gICAgdmFyIHNjZW5lR2VvbWV0cnkgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICB2YXIgc2NlbmVCb3VuZHMgPSBuZXcgVEhSRUUuQm91bmRpbmdCb3hIZWxwZXIoc2NlbmVHZW9tZXRyeSwgMHhmZjAwMDApO1xuXG4gICAgdmFyIGhvc3RPYmplY3RzID0ge307XG5cbiAgICB2YXIgdXBkYXRpbmcgPSBmYWxzZTtcbiAgICB2YXIgaGFzTW91c2UgPSBmYWxzZTtcblxuICAgIHZhciBwbGF5ZXI6UGxheWVyID0gbnVsbDtcbiAgICB2YXIgd29ybGQ6V29ybGQgPSBudWxsO1xuXG4gICAgJHNjb3BlLm9uTG9jayA9IChsb2NrKSA9PiB7XG4gICAgICBpZiAoIXBsYXllcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwbGF5ZXIuZW5hYmxlZCA9IGxvY2s7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgIGluaXRpYWxpemU6IChyLCBzLCBjLCBkKSA9PiB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcImluaXQgY2FsbGVkXCIpO1xuICAgICAgICByZW5kZXJlciA9IHI7XG4gICAgICAgIHNjZW5lID0gcztcbiAgICAgICAgY2FtZXJhID0gYztcbiAgICAgICAgZG9tRWxlbWVudCA9IGQ7XG5cbiAgICAgICAgd29ybGQgPSBuZXcgV29ybGQoc2NlbmUpO1xuICAgICAgICBwbGF5ZXIgPSBuZXcgUGxheWVyKHNjZW5lLCBjYW1lcmEsIGQsIHdvcmxkKTtcblxuICAgICAgICBzY2VuZS5hZGQoc2NlbmVHZW9tZXRyeSk7XG5cbiAgICAgICAgaWYgKGRlYnVnU2NlbmUpIHtcbiAgICAgICAgICAvLyBkZWJ1ZyBzdHVmZlxuICAgICAgICAgIC8vIHB1dHMgYSBib3VuZGluZyBib3ggYXJvdW5kIHRoZSBzY2VuZSB3ZSB3YW50IHRvIHZpZXdcbiAgICAgICAgICBzY2VuZS5hZGQoc2NlbmVCb3VuZHMpO1xuXG4gICAgICAgIH1cbiAgICAgICAgLy8gYWRkcyBsaW5lcyBmb3IgdGhlIHgveS96IGF4aXNcbiAgICAgICAgLy8gVGhlIFggYXhpcyBpcyByZWQuIFRoZSBZIGF4aXMgaXMgZ3JlZW4uIFRoZSBaIGF4aXMgaXMgYmx1ZVxuICAgICAgICB2YXIgYXhpcyA9IG5ldyBUSFJFRS5BeGlzSGVscGVyKDEwMDApO1xuICAgICAgICBzY2VuZS5hZGQoYXhpcyk7XG5cbiAgICAgICAgc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi54ID0gOTA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueiA9IDkwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnggPSAwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnkgPSAwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnogPSAwO1xuICAgICAgICBidWlsZFNjZW5lKCk7XG4gICAgICB9LFxuICAgICAgcmVuZGVyOiAocmVuZGVyZXIsIHNjZW5lLCBjYW1lcmEpID0+IHtcbiAgICAgICAgLy8gTk9URSAtIHRoaXMgZnVuY3Rpb24gcnVucyBhdCB+IDYwZnBzIVxuICAgICAgICBpZiAodXBkYXRpbmcpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgd29ybGQucmVuZGVyKCk7XG4gICAgICAgIHZhciBhbmdsZSA9IERhdGUubm93KCkgKiAwLjAwMDE7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueCA9IDEwMDAgKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueiA9IDEwMDAgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIC8vIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueCArPSAwLjAwMTtcbiAgICAgICAgLy8gc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi55ICs9IDAuMDAxO1xuICAgICAgICAvLyBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnogKz0gMC4wMDE7XG4gICAgICAgIF8uZm9ySW4oaG9zdE9iamVjdHMsIChob3N0T2JqZWN0LCBrZXkpID0+IHtcbiAgICAgICAgICBob3N0T2JqZWN0LnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2NlbmVCb3VuZHMudXBkYXRlKCk7XG4gICAgICAgIHBsYXllci5sb29rQXQoc2NlbmVCb3VuZHMuYm94KTtcbiAgICAgICAgcGxheWVyLnJlbmRlcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkU2NlbmUoKSB7XG4gICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHVwZGF0aW5nID0gdHJ1ZTtcbiAgICAgIHZhciBvcmlnaW5YID0gMDtcbiAgICAgIHZhciBvcmlnaW5ZID0gMDtcblxuICAgICAgdmFyIGhvc3RzVG9SZW1vdmUgPSBbXTtcblxuICAgICAgXy5mb3JJbihob3N0T2JqZWN0cywgKGhvc3RPYmplY3QsIGtleSkgPT4ge1xuICAgICAgICBpZiAoXy5hbnkobW9kZWwuaG9zdHMsIChob3N0KSA9PiBob3N0LmVsZW1lbnRJZCA9PT0ga2V5KSkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcIktlZXBpbmcgaG9zdDogXCIsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaG9zdHNUb1JlbW92ZS5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBfLmZvckVhY2goaG9zdHNUb1JlbW92ZSwgKGtleSkgPT4ge1xuICAgICAgICB2YXIgaG9zdE9iamVjdCA9IGhvc3RPYmplY3RzW2tleV07XG4gICAgICAgIGlmIChob3N0T2JqZWN0KSB7XG4gICAgICAgICAgaG9zdE9iamVjdC5kZXN0cm95KCk7XG4gICAgICAgICAgZGVsZXRlIGhvc3RPYmplY3RzW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBfLmZvckVhY2gobW9kZWwuaG9zdHMsIChob3N0KSA9PiB7XG4gICAgICAgIHZhciBpZCA9IGhvc3QuZWxlbWVudElkO1xuICAgICAgICBsb2cuZGVidWcoXCJob3N0OiBcIiwgaG9zdCk7XG4gICAgICAgIHZhciBob3N0T2JqZWN0ID0gaG9zdE9iamVjdHNbaWRdIHx8IG5ldyBIb3N0T2JqZWN0KHNjZW5lR2VvbWV0cnksIGlkLCBob3N0KTtcbiAgICAgICAgaWYgKCEoaWQgaW4gaG9zdE9iamVjdHMpKSB7XG4gICAgICAgICAgaG9zdE9iamVjdC5zZXRQb3NpdGlvbihvcmlnaW5YLCBvcmlnaW5ZLCAwKTtcbiAgICAgICAgICBvcmlnaW5YID0gb3JpZ2luWCArIDUwMDtcbiAgICAgICAgICBvcmlnaW5ZID0gb3JpZ2luWSArIDUwMDtcbiAgICAgICAgICBob3N0T2JqZWN0c1tpZF0gPSBob3N0T2JqZWN0O1xuICAgICAgICB9XG4gICAgICAgIGhvc3RPYmplY3QudXBkYXRlKG1vZGVsLCBob3N0KTtcbiAgICAgICAgaG9zdE9iamVjdC5kZWJ1ZyhkZWJ1Z1NjZW5lKTtcbiAgICAgIH0pO1xuXG4gICAgICBsb2cuZGVidWcoXCJtb2RlbCB1cGRhdGVkXCIpO1xuICAgICAgdXBkYXRpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgJHNjb3BlLiRvbigna3ViZXJuZXRlc01vZGVsVXBkYXRlZCcsIGJ1aWxkU2NlbmUpO1xuICB9XSk7XG5cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
angular.module("hawtio-kube3d-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/kube3d/html/view.html","<div class=\"kube3d-viewport\" ng-controller=\"Kube3d.ViewController\">\n  <div class=\"kube3d-control\" threejs=\"config\"></div>\n  <div class=\"kube3d-instructions\" request-lock=\'onLock(lock)\'>\n    <div class=\"kube3d-instructions-wrapper\">\n      <span class=\"kube3d-start-title\">Click to play</span>\n    </div>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-kube3d-templates");
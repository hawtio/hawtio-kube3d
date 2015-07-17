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
    var Player = (function () {
        function Player(scene, camera, d) {
            this.scene = scene;
            this.camera = camera;
            this.d = d;
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
                    this.yaw.position.set(0, 0, -5);
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
            var geometry = new THREE.PlaneGeometry(30000, 30000, 100, 100);
            geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
            var material = new THREE.MeshBasicMaterial({ color: 0x222222 });
            var mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
        }
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
                $scope.player = player = new Kube3d.Player(scene, camera, d);
                world = new Kube3d.World(scene);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwia3ViZTNkL3RzL2t1YmUzZEludGVyZmFjZXMudHMiLCJrdWJlM2QvdHMva3ViZTNkSGVscGVycy50cyIsImt1YmUzZC90cy9rdWJlM2RQbHVnaW4udHMiLCJrdWJlM2QvdHMvbG9ja1JlcXVlc3QudHMiLCJrdWJlM2QvdHMvb2JqZWN0cy50cyIsImt1YmUzZC90cy9wbGF5ZXIudHMiLCJrdWJlM2QvdHMvdGhyZWVKU0RpcmVjdGl2ZS50cyIsImt1YmUzZC90cy93b3JsZC50cyIsImt1YmUzZC90cy92aWV3LnRzIl0sIm5hbWVzIjpbIkt1YmUzZCIsIkt1YmUzZC5yZ2JUb0hleCIsIkt1YmUzZC5yYW5kb21HcmV5IiwiS3ViZTNkLndlYmdsQXZhaWxhYmxlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuY29uc3RydWN0b3IiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlc3Ryb3kiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlYnVnIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5tb3ZlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5yb3RhdGUiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmdldFBvc2l0aW9uIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5zZXRQb3NpdGlvbiIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2Uuc2V0Um90YXRpb24iLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnJlbmRlciIsIkt1YmUzZC5Qb2RPYmplY3QiLCJLdWJlM2QuUG9kT2JqZWN0LmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBvZE9iamVjdC51cGRhdGUiLCJLdWJlM2QuUG9kT2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuUG9kT2JqZWN0LmRpc3RhbmNlIiwiS3ViZTNkLlBvZE9iamVjdC5hbmdsZU9mVmVsb2NpdHkiLCJLdWJlM2QuUG9kT2JqZWN0LnJlbmRlciIsIkt1YmUzZC5Ib3N0T2JqZWN0IiwiS3ViZTNkLkhvc3RPYmplY3QuY29uc3RydWN0b3IiLCJLdWJlM2QuSG9zdE9iamVjdC51cGRhdGUiLCJLdWJlM2QuSG9zdE9iamVjdC5kZWJ1ZyIsIkt1YmUzZC5Ib3N0T2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW1vdmVQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5hZGRQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5oYXNQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW5kZXIiLCJLdWJlM2QuUGxheWVyIiwiS3ViZTNkLlBsYXllci5jb25zdHJ1Y3RvciIsIkt1YmUzZC5QbGF5ZXIuZW5hYmxlZCIsIkt1YmUzZC5QbGF5ZXIuc2V0V29ybGRPYmplY3RzQ2FsbGJhY2siLCJLdWJlM2QuUGxheWVyLm9iamVjdCIsIkt1YmUzZC5QbGF5ZXIubG9va0F0IiwiS3ViZTNkLlBsYXllci5kZXN0cm95IiwiS3ViZTNkLlBsYXllci5yZW5kZXIiLCJLdWJlM2Quc3RvcCIsIkt1YmUzZC5jbGVhbnVwIiwiS3ViZTNkLldvcmxkIiwiS3ViZTNkLldvcmxkLmNvbnN0cnVjdG9yIiwiS3ViZTNkLldvcmxkLnJlbmRlciIsIkt1YmUzZC5Xb3JsZC5kZXN0cm95IiwiS3ViZTNkLmJ1aWxkU2NlbmUiXSwibWFwcGluZ3MiOiJBQWtCc0I7O0FDakJ0QixJQUFPLE1BQU0sQ0FZWjtBQVpELFdBQU8sTUFBTSxFQUFDLENBQUM7SUFXWkEsQ0FBQ0E7QUFDSkEsQ0FBQ0EsRUFaTSxNQUFNLEtBQU4sTUFBTSxRQVlaOztBQ1ZELElBQU8sTUFBTSxDQWdDWjtBQWhDRCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBQ0ZBLGlCQUFVQSxHQUFHQSxRQUFRQSxDQUFDQTtJQUN0QkEsVUFBR0EsR0FBa0JBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLGlCQUFVQSxDQUFDQSxDQUFDQTtJQUM1Q0EsbUJBQVlBLEdBQUdBLHFCQUFxQkEsQ0FBQ0E7SUFDckNBLHNCQUFlQSxHQUFHQSxvQkFBb0JBLElBQUlBLFFBQVFBLElBQUlBLHVC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QUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1lBQ2xDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtRQUNwQ0EsQ0FBQ0E7UUFFTUwscUNBQVdBLEdBQWxCQTtZQUNFTSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtZQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7UUFDMUNBLENBQUNBO1FBRU1OLHFDQUFXQSxHQUFsQkEsVUFBbUJBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBO1lBQ3hCTyxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM3QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBRWxDQSxDQUFDQTtRQUVNUCxxQ0FBV0EsR0FBbEJBLFVBQW1CQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQTtZQUMzQlEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFB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Q0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JCQSxNQUFNQSxDQUFDQTtZQUNUQSxDQUFDQTtZQUNEQSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNwQ0EsSUFBSUEsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLFVBQVVBLEdBQUdBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBTTlCQSxJQUFJQSxHQUFHQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsREEsR0FBR0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDMURBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN2REEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDdkRBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUVNTiwyQkFBTUEsR0FBYkEsVUFBY0EsRUFBRUE7WUFDZE8sTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFB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RUE7NEJBQ0xBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBOzRCQUNyQkEsS0FBS0EsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQTs0QkFDTEEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ2xCQSxLQUFLQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUE7NEJBQ0xBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dDQUMxQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0E7Z0NBQ3ZCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxLQUFLQSxDQUFDQTs0QkFDdkJBLENBQUNBOzRCQUNEQSxLQUFLQSxDQUFDQTtvQkFDVkEsQ0FBQ0E7Z0JBQ0hBLENBQUNBO2dCQUNEQSxPQUFPQSxFQUFFQSxVQUFDQSxLQUFTQTtvQkFDakJBLE1BQU1BLENBQUNBLENBQUVBLEtBQUtBLENBQUNBLE9BQVFBLENBQUNBLENBQUNBLENBQUNBO3dCQUN4QkEsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBOzRCQUNMQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxLQUFLQSxDQUFDQTs0QkFDckJBLEtBQUtBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUE7NEJBQ0xBLElBQUlBLENBQUNBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBOzRCQUNsQkEsS0FBS0EsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQTs0QkFDTEEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0E7NEJBQ3RCQSxLQUFLQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBOzRCQUNMQSxJQUFJQSxDQUFD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QVFBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBO1lBQ3hDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUV4Q0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFFbENBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBO2dCQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUM5Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7Z0JBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLEtBQUtBLEdBQUdBLEtBQUtBLENBQUNBO1lBQy9DQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDM0NBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO2dCQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUU1Q0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsVUFBVUEsS0FBS0EsSUFBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFFQSxDQUFDQTtnQkFDdkNBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBO1lBQ3RCQSxDQUFDQTtZQUVEQSxFQUFFQSxDQUFDQSxVQUFVQSxDQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFFQSxDQUFDQTtZQUNwQ0EsRUFBRUEsQ0FBQ0EsVUFBVUEsQ0FBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBRUEsQ0FBQ0E7WUFDcENBLEVBQUVBLENBQUNBLFVBQVVBLENBQUVBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUVBLENBQUNBO1lBRXBDQSxFQUFFQSxDQUFDQSxDQUFFQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFFekJBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNmQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDbkJBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBO1lBQ3RCQSxDQUFDQTtZQUVEQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFDSFAsYUFBQ0E7SUFBREEsQ0F2TUE5QixBQXVNQzhCLElBQUE5QjtJQXZNWUEsYUFBTUEsR0FBTkEsTUF1TVpBLENBQUFBO0FBQ0hBLENBQUNBLEVBMU1NLE1BQU0sS0FBTixNQUFNLFFBME1aOztBQzFNRCxJQUFPLE1BQU0sQ0F3SFo7QUF4SEQsV0FBTyxNQUFNLEVBQUMsQ0FBQztJQUViQSxJQUFJQSxhQUFhQSxHQUFHQSxTQUFTQSxDQUFDQTtJQUU5QkEsY0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7UUFDaENBLEtBQUtBLENBQUNBLFVBQVVBLENBQUNBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2xDQSxNQUFNQSxDQUFDQTtZQUNMQSxRQUFRQSxFQUFFQSxHQUFHQTtZQUNiQSxPQUFPQSxFQUFFQSxJQUFJQTtZQUNiQSxLQUFLQSxFQUFFQTtnQkFDTEEsTUFBTUEsRUFBRUEsSUFBSUEsR0FBR0EsYUFBYUE7YUFDN0JBO1lBQ0RBLElBQUlBLEVBQUVBLFVBQUNBLEtBQUtBLEVBQUVBLE9BQU9BLEVBQUVBLEtBQUtBO2dCQUUxQkEsSUFBSUEsS0FBS0EsR0FBT0EsSUFBSUEsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxNQUFNQSxHQUFPQSxJQUFJQSxDQUFDQTtnQkFDdEJBLElBQUlBLFFBQVFBLEdBQU9BLElBQUlBLENBQUNBO2dCQUN4QkEsSUFBSUEsYUFBYUEsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQ3pCQSxJQUFJQSxZQUFZQSxHQUFPQSxJQUFJQSxDQUFDQTtnQkFFNUJBLFNBQVNBLElBQUlBO29CQUNYc0MsYUFBYUEsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ3hCQSxDQUFDQTtnQkFFRHRDLFNBQVNBLE9BQU9BO29CQUNkdUMsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3BDQSxPQUFPQSxRQUFRQSxDQUFDQTtvQkFDaEJBLE9BQU9BLE1BQU1BLENBQUNBO29CQUNkQSxPQUFPQSxLQUFLQSxDQUFDQTtvQkFDYkEsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7Z0JBQ2xCQSxDQUFDQTtnQkFFRHZDLElBQUlBLFVBQVVBLEdBQUdBO29CQUNiQSxVQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtvQkFDdEJBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBO29CQUN2RUEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7b0JBQ25EQSxNQUFNQSxDQUFDQSxzQkFBc0JBLEVBQUVBLENBQUNBO29CQUNoQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsRUFBRUEsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hEQSxDQUFDQSxDQUFBQTtnQkFFREEsT0FBT0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsVUFBVUEsRUFBRUE7b0JBQ3JCQSxJQUFJQSxFQUFFQSxDQUFDQTtvQkFDUEEsVUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQTtnQkFDL0JBLENBQUNBLENBQUNBLENBQUNBO2dCQUVIQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxFQUFFQSxVQUFDQSxNQUFNQTtvQkFDNUJBLElBQUlBLEVBQUVBLENBQUNBO29CQUNQQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbENBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLHNCQUFzQkEsQ0FBQ0EsQ0FBQ0E7d0JBQ2xDQSxNQUFNQSxDQUFDQTtvQkFDVEEsQ0FBQ0E7b0JBR0RBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0E7b0JBQzVCQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtvQkFDMUJBLE1BQU1BLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsRUFBRUEsRUFBRUEsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsR0FBR0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBRXpGQSxNQUFNQSxDQUFDQSxLQUFLQSxHQUFHQSxVQUFDQSxJQUFRQSxFQUFFQSxLQUFLQSxFQUFFQSxDQUFjQTt3QkFBZEEsaUJBQWNBLEdBQWRBLFVBQWNBO3dCQUc3Q0EsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzNCQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFFaERBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLElBQUlBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBOzRCQUM1QkEsTUFBTUEsQ0FBQ0E7d0JBQ1RBLENBQUNBO3dCQUNEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFFQSxHQUFHQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbEZBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNqRkEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBRTVCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDakNBLElBQUlBLE1BQU1BLEdBQUdBLEdBQUdBLENBQUNBO3dCQUNqQkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDdkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBOzRCQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTs0QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTt3QkFDSEEsQ0FBQ0E7d0JBQ0RBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBO29CQUMxQkEsQ0FBQ0EsQ0FBQ0E7b0JBRUZBLEVBQUVBLENBQUNBLENBQUVBLHFCQUFjQSxFQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdkJBLFFBQVFBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO29CQUN2Q0EsQ0FBQ0E7b0JBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUNOQSxRQUFRQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxjQUFjQSxFQUFF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RUhBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO1lBQzNCQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUNuQkEsQ0FBQ0E7UUFDRDVDLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLHdCQUF3QkEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7SUFDbkRBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBRU5BLENBQUNBLEVBL0hNLE1BQU0sS0FBTixNQUFNLFFBK0haIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9saWJzL2hhd3Rpby11dGlsaXRpZXMvZGVmcy5kLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2xpYnMvaGF3dGlvLWt1YmVybmV0ZXMvZGVmcy5kLnRzXCIvPlxuXG5kZWNsYXJlIHZhciBUSFJFRTphbnk7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgaW50ZXJmYWNlIFJlbmRlcmFibGUge1xuICAgIHJlbmRlcigpOnZvaWQ7XG4gICAgZGVzdHJveSgpOnZvaWQ7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIFNjZW5lT2JqZWN0IGV4dGVuZHMgUmVuZGVyYWJsZXtcbiAgICBnZXRQb3NpdGlvbigpOmFueTtcbiAgICBzZXRQb3NpdGlvbih4LCB5LCB6KTtcbiAgICBzZXRSb3RhdGlvbihyeCwgcnksIHJ6KTtcbiAgfTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RJbnRlcmZhY2VzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gJ0t1YmUzZCc7XG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldChwbHVnaW5OYW1lKTtcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9rdWJlM2QvaHRtbCc7XG4gIGV4cG9ydCB2YXIgaGF2ZVBvaW50ZXJMb2NrID0gJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQgfHwgJ21velBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQgfHwgJ3dlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQ7XG5cblxuICBleHBvcnQgdmFyIEhhbGZQSSA9IE1hdGguUEkgLyAyO1xuXG4gIGV4cG9ydCBmdW5jdGlvbiByZ2JUb0hleChyLCBnLCBiKSB7XG4gICAgcmV0dXJuIFwiI1wiICsgKCgxIDw8IDI0KSArIChyIDw8IDE2KSArIChnIDw8IDgpICsgYikudG9TdHJpbmcoMTYpLnNsaWNlKDEpO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbUdyZXkoKSB7XG4gICAgdmFyIHJnYlZhbCA9IE1hdGgucmFuZG9tKCkgKiAxMjggKyAxMjg7XG4gICAgcmV0dXJuIHJnYlRvSGV4KHJnYlZhbCwgcmdiVmFsLCByZ2JWYWwpO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHdlYmdsQXZhaWxhYmxlKCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICAgIHJldHVybiAhISggKDxhbnk+d2luZG93KS5XZWJHTFJlbmRlcmluZ0NvbnRleHQgJiYgKFxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcgKSB8fFxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoICdleHBlcmltZW50YWwtd2ViZ2wnICkgKVxuICAgICAgICAgICk7XG4gICAgfSBjYXRjaCAoIGUgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSGVscGVycy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuICBleHBvcnQgdmFyIGNvbnRyb2xsZXIgPSBQbHVnaW5IZWxwZXJzLmNyZWF0ZUNvbnRyb2xsZXJGdW5jdGlvbihfbW9kdWxlLCBwbHVnaW5OYW1lKTtcblxuICB2YXIgdGFiID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCBcIkhhd3Rpb05hdkJ1aWxkZXJQcm92aWRlclwiLCAoJHJvdXRlUHJvdmlkZXI6IG5nLnJvdXRlLklSb3V0ZVByb3ZpZGVyLCBidWlsZGVyOiBIYXd0aW9NYWluTmF2LkJ1aWxkZXJGYWN0b3J5KSA9PiB7XG4gICAgdGFiID0gYnVpbGRlci5jcmVhdGUoKVxuICAgICAgLmlkKHBsdWdpbk5hbWUpXG4gICAgICAudGl0bGUoKCkgPT4gJzNEIFZpZXcnKVxuICAgICAgLmhyZWYoKCkgPT4gJy9rdWJlcm5ldGVzLzNkJylcbiAgICAgIC5wYWdlKCgpID0+IGJ1aWxkZXIuam9pbih0ZW1wbGF0ZVBhdGgsICd2aWV3Lmh0bWwnKSlcbiAgICAgIC5idWlsZCgpO1xuICAgIGJ1aWxkZXIuY29uZmlndXJlUm91dGluZygkcm91dGVQcm92aWRlciwgdGFiKTtcblxuICB9XSk7XG5cbiAgX21vZHVsZS5ydW4oWydIYXd0aW9OYXYnLCAobmF2KSA9PiB7XG4gICAgbmF2Lm9uKEhhd3Rpb01haW5OYXYuQWN0aW9ucy5BREQsIHBsdWdpbk5hbWUsIChpdGVtKSA9PiB7XG4gICAgICBpZiAoaXRlbS5pZCAhPT0gJ2t1YmVybmV0ZXMnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghXy5hbnkoaXRlbS50YWJzLCAodGFiOmFueSkgPT4gdGFiLmlkID09PSBwbHVnaW5OYW1lKSkge1xuICAgICAgICBpdGVtLnRhYnMucHVzaCh0YWIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XSk7XG5cblxuICBoYXd0aW9QbHVnaW5Mb2FkZXIuYWRkTW9kdWxlKHBsdWdpbk5hbWUpO1xuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkUGx1Z2luLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBfbW9kdWxlLmRpcmVjdGl2ZSgncmVxdWVzdExvY2snLCBbJyRkb2N1bWVudCcsICgkZG9jdW1lbnQpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgICdvbkxvY2snOiAnJnJlcXVlc3RMb2NrJ1xuICAgICAgfSxcbiAgICAgIGxpbms6IChzY29wZSwgZWxlbWVudCwgYXR0cikgPT4ge1xuICAgICAgICB2YXIgZWwgPSBlbGVtZW50WzBdIHx8IGVsZW1lbnQ7XG4gICAgICAgIGlmIChoYXZlUG9pbnRlckxvY2spIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJoZXJlIVwiKTtcbiAgICAgICAgICB2YXIgZG9jID0gJGRvY3VtZW50WzBdO1xuICAgICAgICAgIHZhciBib2R5ID0gZG9jLmJvZHk7XG5cbiAgICAgICAgICB2YXIgcG9pbnRlcmxvY2tjaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICggZG9jLnBvaW50ZXJMb2NrRWxlbWVudCA9PT0gYm9keSB8fCBcbiAgICAgICAgICAgICAgICAgZG9jLm1velBvaW50ZXJMb2NrRWxlbWVudCA9PT0gYm9keSB8fCBcbiAgICAgICAgICAgICAgICAgZG9jLndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCA9PT0gYm9keSApIHtcbiAgICAgICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgc2NvcGUub25Mb2NrKHsgbG9jazogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICAgICAgc2NvcGUub25Mb2NrKHsgbG9jazogZmFsc2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb3JlLiRhcHBseShzY29wZSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHZhciBwb2ludGVybG9ja2Vycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAncG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UgKTtcbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ21venBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlICk7XG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSApO1xuXG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICdwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UgKTtcbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSApO1xuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAnd2Via2l0cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlICk7XG5cbiAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgIGJvZHkucmVxdWVzdFBvaW50ZXJMb2NrID0gYm9keS5yZXF1ZXN0UG9pbnRlckxvY2sgfHwgYm9keS5tb3pSZXF1ZXN0UG9pbnRlckxvY2sgfHwgYm9keS53ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2s7XG4gICAgICAgICAgICBib2R5LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7IFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RJbnRlcmZhY2VzLnRzXCIvPlxubW9kdWxlIEt1YmUzZCB7XG5cbiAgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ0t1YmUzZCcpO1xuXG4gIGV4cG9ydCBjbGFzcyBTY2VuZU9iamVjdEJhc2UgaW1wbGVtZW50cyBTY2VuZU9iamVjdCB7XG5cbiAgICBwcml2YXRlIGJvdW5kaW5nQm94OmFueSA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgc2NlbmU6YW55LCBwdWJsaWMgZ2VvbWV0cnk6YW55KSB7XG4gICAgICB0aGlzLnNjZW5lLmFkZChnZW9tZXRyeSk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94ID0gbmV3IFRIUkVFLkJvdW5kaW5nQm94SGVscGVyKHRoaXMuZ2VvbWV0cnksIDB4MDBmZjAwKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuYm91bmRpbmdCb3gpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5nZW9tZXRyeSk7XG4gICAgICB0aGlzLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIGRlbGV0ZSB0aGlzLmdlb21ldHJ5O1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1ZyhlbmFibGUpIHtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gudmlzaWJsZSA9IGVuYWJsZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbW92ZSh4LCB5LCB6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnggKz0geDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueSArPSB5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi56ICs9IHo7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnggKz0geDtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueSArPSB5O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi56ICs9IHo7XG4gICAgfVxuXG4gICAgcHVibGljIHJvdGF0ZShyeCwgcnksIHJ6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnggKz0gcng7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnkgKz0gcnk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnogKz0gcno7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnJvdGF0aW9uLnggKz0gcng7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnJvdGF0aW9uLnkgKz0gcnk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnJvdGF0aW9uLnogKz0gcno7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFBvc2l0aW9uKCkge1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC51cGRhdGUoKTtcbiAgICAgIHJldHVybiB0aGlzLmJvdW5kaW5nQm94Lm9iamVjdC5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb24oeCwgeSwgeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi54ID0geDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueSA9IHk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnogPSB6O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi54ID0geDtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueSA9IHk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnogPSB6O1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFJvdGF0aW9uKHJ4LCByeSwgcnopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueCA9IHJ4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi55ID0gcnk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnogPSByejtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueCA9IHJ4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi55ID0gcnk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnogPSByejtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC51cGRhdGUoKTtcbiAgICB9XG5cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBQb2RPYmplY3QgZXh0ZW5kcyBTY2VuZU9iamVjdEJhc2Uge1xuICAgIHByaXZhdGUgYW5nbGU6bnVtYmVyID0gdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgY2lyY2xlOmFueSA9IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIHJvdGF0aW9uID0ge1xuICAgICAgeDogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAwLFxuICAgICAgeTogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAsXG4gICAgICB6OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMDBcbiAgICB9O1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBzY2VuZTogYW55LCBwdWJsaWMgaG9zdE9iamVjdDpIb3N0T2JqZWN0LCBwdWJsaWMgaWQ6c3RyaW5nLCBwdWJsaWMgb2JqOmFueSkge1xuICAgICAgc3VwZXIoc2NlbmUsIG5ldyBUSFJFRS5PYmplY3QzRCgpKTtcbiAgICAgIHZhciB0ZXh0dXJlID0gVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZShvYmouJGljb25VcmwpO1xuICAgICAgdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICAgICAgdGhpcy5nZW9tZXRyeS5hZGQoXG4gICAgICAgICAgbmV3IFRIUkVFLk1lc2goXG4gICAgICAgICAgICBuZXcgVEhSRUUuQm94R2VvbWV0cnkoNTAsIDUwLCA1MCksIFxuICAgICAgICAgICAgbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICAgICAgICAgICAgY29sb3I6IDB4ZmZmZmZmLCBcbiAgICAgICAgICAgICAgbWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBidW1wTWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBjYXN0U2hhZG93OiB0cnVlLCBcbiAgICAgICAgICAgICAgcmVjZWl2ZVNoYWRvdzogdHJ1ZSwgXG4gICAgICAgICAgICAgIHNoYWRpbmc6IFRIUkVFLlNtb290aFNoYWRpbmdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkNyZWF0ZWQgcG9kIG9iamVjdCBcIiwgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGUobW9kZWwsIHBvZCkge1xuICAgICAgdGhpcy5vYmogPSBwb2Q7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgICB0aGlzLmhvc3RPYmplY3QuZ2VvbWV0cnkucmVtb3ZlKHRoaXMuY2lyY2xlKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkRlc3Ryb3llZCBwb2Qgb2JqZWN0IFwiLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRpc3RhbmNlKCkge1xuICAgICAgdmFyIGhvc3RQb3NpdGlvbiA9IHRoaXMuaG9zdE9iamVjdC5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIG15UG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgZGlzdFggPSBNYXRoLmFicyhob3N0UG9zaXRpb24ueCAtIG15UG9zaXRpb24ueCk7XG4gICAgICB2YXIgZGlzdFkgPSBNYXRoLmFicyhob3N0UG9zaXRpb24ueSAtIG15UG9zaXRpb24ueSk7XG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KGRpc3RYICogZGlzdFggKyBkaXN0WSAqIGRpc3RZKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFuZ2xlT2ZWZWxvY2l0eSgpIHtcbiAgICAgIGlmICghdGhpcy5hbmdsZSkge1xuICAgICAgICB2YXIgZGlzdCA9IHRoaXMuZGlzdGFuY2UoKTtcbiAgICAgICAgbG9nLmRlYnVnKFwicG9kIGlkOiBcIiwgdGhpcy5pZCwgXCIgZGlzdGFuY2U6IFwiLCBkaXN0KTtcbiAgICAgICAgdGhpcy5hbmdsZSA9ICgxIC8gZGlzdCkgKiAxMDtcbiAgICAgICAgbG9nLmRlYnVnKFwicG9kIGlkOiBcIiwgdGhpcy5pZCwgXCIgYW5nbGU6IFwiLCB0aGlzLmFuZ2xlKTtcbiAgICAgICAgdmFyIG1hdGVyaWFsQXJyYXkgPSBbXTtcbiAgICAgICAgdmFyIGZhY2UgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoeyBcbiAgICAgICAgICBjb2xvcjogMHg1NTU1NTUsXG4gICAgICAgICAgY2FzdFNoYWRvdzogdHJ1ZSxcbiAgICAgICAgICByZWNlaXZlU2hhZG93OiB0cnVlLFxuICAgICAgICAgIHdpcmVmcmFtZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgbWF0ZXJpYWxBcnJheS5wdXNoKGZhY2UuY2xvbmUoKSk7XG4gICAgICAgIG1hdGVyaWFsQXJyYXkucHVzaChmYWNlLmNsb25lKCkpO1xuICAgICAgICB0aGlzLmNpcmNsZSA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5SaW5nR2VvbWV0cnkoZGlzdCAtIDEsIGRpc3QgKyAxLCAxMjgpLCBuZXcgVEhSRUUuTWVzaEZhY2VNYXRlcmlhbChtYXRlcmlhbEFycmF5KSk7XG4gICAgICAgIHRoaXMuaG9zdE9iamVjdC5nZW9tZXRyeS5hZGQodGhpcy5jaXJjbGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYW5nbGU7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIHZhciBteVBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIGhvc3RQb3NpdGlvbiA9IHRoaXMuaG9zdE9iamVjdC5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIHggPSBteVBvc2l0aW9uLng7XG4gICAgICB2YXIgeSA9IG15UG9zaXRpb24ueTtcbiAgICAgIHZhciBjZW50ZXJYID0gaG9zdFBvc2l0aW9uLng7XG4gICAgICB2YXIgY2VudGVyWSA9IGhvc3RQb3NpdGlvbi55O1xuICAgICAgdmFyIG9mZnNldFggPSB4IC0gY2VudGVyWDtcbiAgICAgIHZhciBvZmZzZXRZID0geSAtIGNlbnRlclk7XG4gICAgICB2YXIgYW5nbGUgPSB0aGlzLmFuZ2xlT2ZWZWxvY2l0eSgpO1xuICAgICAgdmFyIG5ld1ggPSBjZW50ZXJYICsgb2Zmc2V0WCAqIE1hdGguY29zKGFuZ2xlKSAtIG9mZnNldFkgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICB2YXIgbmV3WSA9IGNlbnRlclkgKyBvZmZzZXRYICogTWF0aC5zaW4oYW5nbGUpICsgb2Zmc2V0WSAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgIHRoaXMuc2V0UG9zaXRpb24obmV3WCwgbmV3WSwgMCk7XG4gICAgICB0aGlzLnJvdGF0ZSh0aGlzLnJvdGF0aW9uLngsIHRoaXMucm90YXRpb24ueSwgdGhpcy5yb3RhdGlvbi56KTtcbiAgICAgIHN1cGVyLnJlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBIb3N0T2JqZWN0IGV4dGVuZHMgU2NlbmVPYmplY3RCYXNlIHtcbiAgICBwcml2YXRlIG9mZnNldFggPSAyMDA7XG4gICAgcHJpdmF0ZSBvZmZzZXRZID0gMjAwO1xuICAgIHB1YmxpYyBwb2RzID0ge307XG4gICAgcHVibGljIHJvdGF0aW9uID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB6OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMDBcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihzY2VuZTogYW55LCBwdWJsaWMgaWQ6c3RyaW5nLCBwdWJsaWMgb2JqOmFueSkge1xuICAgICAgc3VwZXIoc2NlbmUsIG5ldyBUSFJFRS5PYmplY3QzRCgpKVxuICAgICAgdmFyIHRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdpbWcvc3VuLXRleHR1cmUuanBnJyk7XG4gICAgICB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gICAgICB0aGlzLmdlb21ldHJ5LmFkZCggXG4gICAgICAgICAgbmV3IFRIUkVFLlBvaW50TGlnaHQoMHhmZmQ3MDAsIDEsIDUwMDApLFxuICAgICAgICAgIG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICAgICAgbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDEwMCwgMzIsIDE2KSwgXG4gICAgICAgICAgICBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xuICAgICAgICAgICAgICBjb2xvcjogMHhmZmQ3MDAsIFxuICAgICAgICAgICAgICBtYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIGJ1bXBNYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIHNwZWN1bGFyOiAweDAwZmYwMCwgXG4gICAgICAgICAgICAgIHNoYWRpbmc6IFRIUkVFLlNtb290aFNoYWRpbmdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgbG9nLmRlYnVnKFwiQ3JlYXRlZCBob3N0IG9iamVjdCBcIiwgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGUobW9kZWwsIGhvc3QpIHtcbiAgICAgIHRoaXMub2JqID0gaG9zdDtcbiAgICAgIHZhciBwb2RzVG9SZW1vdmUgPSBbXTtcbiAgICAgIF8uZm9ySW4odGhpcy5wb2RzLCAocG9kLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKCEoa2V5IGluIG1vZGVsLnBvZHNCeUtleSkpIHtcbiAgICAgICAgICBwb2RzVG9SZW1vdmUucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIF8uZm9yRWFjaChwb2RzVG9SZW1vdmUsIChpZCkgPT4gdGhpcy5yZW1vdmVQb2QoaWQpKTtcbiAgICAgIF8uZm9yRWFjaCh0aGlzLm9iai5wb2RzLCAocG9kOmFueSkgPT4ge1xuICAgICAgICB2YXIgbmFtZSA9IHBvZC5fa2V5O1xuICAgICAgICBpZiAoIXRoaXMuaGFzUG9kKG5hbWUpKSB7XG4gICAgICAgICAgdGhpcy5hZGRQb2QobmFtZSwgcG9kKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgcG9kT2JqID0gdGhpcy5wb2RzW25hbWVdO1xuICAgICAgICAgIHBvZE9iai51cGRhdGUobW9kZWwsIHBvZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1ZyhlbmFibGUpIHtcbiAgICAgIHZhciBpZHMgPSBfLmtleXModGhpcy5wb2RzKVxuICAgICAgXy5mb3JFYWNoKGlkcywgKGlkKSA9PiB0aGlzLnBvZHNbaWRdLmRlYnVnKGVuYWJsZSkpO1xuICAgICAgc3VwZXIuZGVidWcoZW5hYmxlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIGlmICh0aGlzLnBvZHMpIHtcbiAgICAgICAgdmFyIHBvZElkcyA9IF8ua2V5cyh0aGlzLnBvZHMpO1xuICAgICAgICBfLmZvckVhY2gocG9kSWRzLCAoaWQpID0+IHRoaXMucmVtb3ZlUG9kKGlkKSk7XG4gICAgICB9XG4gICAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgICBsb2cuZGVidWcoXCJEZXN0cm95aW5nIGhvc3Qgb2JqZWN0IFwiLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlUG9kKGlkKSB7XG4gICAgICB2YXIgcG9kID0gdGhpcy5wb2RzW2lkXTtcbiAgICAgIGlmIChwb2QpIHtcbiAgICAgICAgcG9kLmRlc3Ryb3koKTtcbiAgICAgICAgZGVsZXRlIHRoaXMucG9kc1tpZF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFBvZChrZXksIHA6YW55KSB7XG4gICAgICBpZiAodGhpcy5oYXNQb2Qoa2V5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbXlQb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBwb2RPZmZzZXRYID0gdGhpcy5vZmZzZXRYIC0gbXlQb3NpdGlvbi54O1xuICAgICAgdmFyIHBvZE9mZnNldFkgPSBteVBvc2l0aW9uLnk7XG4gICAgICAvKlxuICAgICAgdmFyIGFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgICAgIHZhciBwb2RYID0gbXlQb3NpdGlvbi54ICsgcG9kT2Zmc2V0WCAqIE1hdGguY29zKGFuZ2xlKSAtIHBvZE9mZnNldFkgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICB2YXIgcG9kWSA9IG15UG9zaXRpb24ueSArIHBvZE9mZnNldFggKiBNYXRoLnNpbihhbmdsZSkgLSBwb2RPZmZzZXRZICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgKi9cbiAgICAgIHZhciBwb2QgPSBuZXcgUG9kT2JqZWN0KHRoaXMuc2NlbmUsIHRoaXMsIGtleSwgcCk7XG4gICAgICBwb2Quc2V0UG9zaXRpb24obXlQb3NpdGlvbi54LCBteVBvc2l0aW9uLnksIG15UG9zaXRpb24ueik7XG4gICAgICBwb2QubW92ZSh0aGlzLm9mZnNldFgsIDAsIDApO1xuICAgICAgdGhpcy5vZmZzZXRYID0gdGhpcy5vZmZzZXRYICsgTWF0aC5yYW5kb20oKSAqIDUwICsgMTAwO1xuICAgICAgdGhpcy5vZmZzZXRZID0gdGhpcy5vZmZzZXRZICsgTWF0aC5yYW5kb20oKSAqIDUwICsgMTAwO1xuICAgICAgdGhpcy5wb2RzW2tleV0gPSBwb2Q7XG4gICAgfVxuXG4gICAgcHVibGljIGhhc1BvZChpZCkge1xuICAgICAgcmV0dXJuIChpZCBpbiB0aGlzLnBvZHMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RlcCA9IDA7XG4gICAgXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIHRoaXMucm90YXRlKHRoaXMucm90YXRpb24ueCwgdGhpcy5yb3RhdGlvbi55LCB0aGlzLnJvdGF0aW9uLnopO1xuICAgICAgXy5mb3JJbih0aGlzLnBvZHMsIChwb2RPYmplY3QsIGlkKSA9PiB7XG4gICAgICAgIHBvZE9iamVjdC5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5zdGVwID0gdGhpcy5zdGVwICsgMTtcbiAgICAgIHN1cGVyLnJlbmRlcigpO1xuICAgIH1cblxuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEhlbHBlcnMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCBjbGFzcyBQbGF5ZXIgaW1wbGVtZW50cyBSZW5kZXJhYmxlIHtcbiAgICBwcml2YXRlIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ2t1YmUzZC1wbGF5ZXInKTtcbiAgICBwcml2YXRlIGRvbUVsZW1lbnQ6YW55ID0gbnVsbDtcbiAgICBwcml2YXRlIF9sb29rQXQ6YW55ID0gbnVsbDtcbiAgICBwcml2YXRlIHBpdGNoID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgcHJpdmF0ZSB5YXcgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIHByaXZhdGUgX2VuYWJsZWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9kb2N1bWVudCA9IHVuZGVmaW5lZDtcblxuICAgIHByaXZhdGUgZ2V0V29ybGRPYmplY3RzOmFueSA9ICgpID0+IFtdO1xuXG4gICAgcHJpdmF0ZSByYXljYXN0ZXIgPSBuZXcgVEhSRUUuUmF5Y2FzdGVyKG5ldyBUSFJFRS5WZWN0b3IzKCksIG5ldyBUSFJFRS5WZWN0b3IzKDAsIC0xLCAwKSwgMCwgMTApO1xuXG4gICAgLy8gbW92ZW1lbnQgYm9vbGVhbnNcbiAgICBwcml2YXRlIGZvcndhcmQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGJhY2t3YXJkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBsZWZ0ID0gZmFsc2U7XG4gICAgcHJpdmF0ZSByaWdodCA9IGZhbHNlO1xuICAgIHByaXZhdGUgY2FuSnVtcCA9IHRydWU7XG5cbiAgICAvLyBtb3ZlbWVudCB2ZWxvY2l0eVxuICAgIHByaXZhdGUgdmVsb2NpdHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcHJldlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIC8vIGtleS9tb3VzZSBoYW5kbGVyc1xuICAgIHByaXZhdGUgaGFuZGxlcnM6YW55ID0gbnVsbDtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHNjZW5lLCBwcml2YXRlIGNhbWVyYSwgcHJpdmF0ZSBkKSB7XG5cbiAgICAgIGNhbWVyYS5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgdGhpcy5waXRjaC5hZGQoY2FtZXJhKTtcbiAgICAgIHRoaXMueWF3LmFkZCh0aGlzLnBpdGNoKTtcbiAgICAgIHNjZW5lLmFkZCh0aGlzLnlhdyk7XG5cbiAgICAgIHRoaXMueWF3LnBvc2l0aW9uLnNldCgwLCAwLCAtNSk7XG5cbiAgICAgIHZhciBkb21FbGVtZW50ID0gdGhpcy5kb21FbGVtZW50ID0gJChkKTtcblxuICAgICAgaWYgKCFoYXZlUG9pbnRlckxvY2spIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBzZWxmLmhhbmRsZXJzID0ge1xuICAgICAgICAna2V5ZG93bic6IChldmVudDphbnkpID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKCBldmVudC5rZXlDb2RlICkge1xuICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgICAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgICAgICAgc2VsZi5mb3J3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICAgICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgICAgICAgIHNlbGYubGVmdCA9IHRydWU7IFxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgICAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgICAgICAgc2VsZi5iYWNrd2FyZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgICAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgICAgICAgc2VsZi5yaWdodCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzMjogLy8gc3BhY2VcbiAgICAgICAgICAgICAgaWYgKHNlbGYuY2FuSnVtcCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHNlbGYudmVsb2NpdHkueSArPSAzNTA7XG4gICAgICAgICAgICAgICAgc2VsZi5jYW5KdW1wID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAna2V5dXAnOiAoZXZlbnQ6YW55KSA9PiB7XG4gICAgICAgICAgc3dpdGNoICggZXZlbnQua2V5Q29kZSApIHtcbiAgICAgICAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICAgICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgICAgICAgIHNlbGYuZm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgICAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgICAgICAgc2VsZi5sZWZ0ID0gZmFsc2U7IFxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgICAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgICAgICAgc2VsZi5iYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICAgICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgICAgICAgIHNlbGYucmlnaHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAnbW91c2Vtb3ZlJzogKGV2ZW50OmFueSkgPT4ge1xuICAgICAgICAgIGlmICghc2VsZi5fZW5hYmxlZCB8fCAhaGF2ZVBvaW50ZXJMb2NrKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciB5YXcgPSBzZWxmLnlhdztcbiAgICAgICAgICB2YXIgcGl0Y2ggPSBzZWxmLnBpdGNoO1xuICAgICAgICAgIHZhciBkZWx0YVggPSBldmVudC5tb3ZlbWVudFggfHwgZXZlbnQubW96TW92ZW1lbnRYIHx8IGV2ZW50LndlYmtpdE1vdmVtZW50WCB8fCAwO1xuICAgICAgICAgIHZhciBkZWx0YVkgPSBldmVudC5tb3ZlbWVudFkgfHwgZXZlbnQubW96TW92ZW1lbnRYIHx8IGV2ZW50LndlYmtpdE1vdmVtZW50WCB8fCAwO1xuICAgICAgICAgIHlhdy5yb3RhdGlvbi55IC09IGRlbHRhWCAqIDAuMDAyO1xuICAgICAgICAgIHBpdGNoLnJvdGF0aW9uLnggLT0gZGVsdGFZICogMC4wMDI7XG4gICAgICAgICAgcGl0Y2gucm90YXRpb24ueCA9IE1hdGgubWF4KC1IYWxmUEksIE1hdGgubWluKEhhbGZQSSwgcGl0Y2gucm90YXRpb24ueCkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXy5mb3JJbih0aGlzLmhhbmRsZXJzLCAoaGFuZGxlciwgZXZ0KSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2dCwgaGFuZGxlciwgZmFsc2UpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgdGhpcy5fZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICBpZiAoZW5hYmxlZCkge1xuICAgICAgICB0aGlzLmNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMuY2FtZXJhLnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy55YXcucG9zaXRpb24uc2V0KDAsIDAsIC01KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMueWF3LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy55YXcucm90YXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLnBpdGNoLnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRXb3JsZE9iamVjdHNDYWxsYmFjayhmdW5jKSB7XG4gICAgICB0aGlzLmdldFdvcmxkT2JqZWN0cyA9IGZ1bmM7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBlbmFibGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBvYmplY3QoKSB7XG4gICAgICByZXR1cm4gdGhpcy55YXc7XG4gICAgfVxuXG4gICAgcHVibGljIGxvb2tBdChib3gpIHtcbiAgICAgIHRoaXMuX2xvb2tBdCA9IGJveDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKHRoaXMueWF3KTtcbiAgICAgIHRoaXMueWF3LmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMucGl0Y2guZGlzcG9zZSgpO1xuICAgICAgXy5mb3JJbih0aGlzLmhhbmRsZXJzLCAoaGFuZGxlciwgZXZ0KSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2dCwgaGFuZGxlcikpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCB8fCAhaGF2ZVBvaW50ZXJMb2NrKSB7XG4gICAgICAgIGlmICh0aGlzLl9sb29rQXQpIHtcbiAgICAgICAgICB2YXIgYW5nbGUgPSBEYXRlLm5vdygpICogMC4wMDAxO1xuICAgICAgICAgIHRoaXMuY2FtZXJhLmZvY3VzKHRoaXMuX2xvb2tBdCwgYW5nbGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHJheWNhc3RlciA9IHRoaXMucmF5Y2FzdGVyO1xuICAgICAgdmFyIHZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eTtcbiAgICAgIHZhciBtZSA9IHRoaXMub2JqZWN0O1xuXG4gICAgICByYXljYXN0ZXIucmF5Lm9yaWdpbi5jb3B5KCB0aGlzLnlhdy5wb3NpdGlvbiApO1xuICAgICAgcmF5Y2FzdGVyLnJheS5vcmlnaW4ueSAtPSAxMDtcblxuICAgICAgdmFyIG9iamVjdHMgPSB0aGlzLmdldFdvcmxkT2JqZWN0cygpO1xuXG4gICAgICB2YXIgaW50ZXJzZWN0aW9ucyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMpO1xuXG4gICAgICB2YXIgaXNPbk9iamVjdCA9IGludGVyc2VjdGlvbnMubGVuZ3RoID4gMDtcblxuICAgICAgdmFyIHRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgIHZhciBkZWx0YSA9ICggdGltZSAtIHRoaXMucHJldlRpbWUgKSAvIDEwMDA7XG5cbiAgICAgIHZlbG9jaXR5LnggLT0gdmVsb2NpdHkueCAqIDEwLjAgKiBkZWx0YTtcbiAgICAgIHZlbG9jaXR5LnogLT0gdmVsb2NpdHkueiAqIDEwLjAgKiBkZWx0YTtcblxuICAgICAgdmVsb2NpdHkueSAtPSA5LjggKiAxMDAuMCAqIGRlbHRhOyAvLyAxMDAuMCA9IG1hc3NcblxuICAgICAgaWYgKHRoaXMuZm9yd2FyZCkgdmVsb2NpdHkueiAtPSA0MDAuMCAqIGRlbHRhO1xuICAgICAgaWYgKHRoaXMuYmFja3dhcmQpIHZlbG9jaXR5LnogKz0gNDAwLjAgKiBkZWx0YTtcbiAgICAgIGlmICh0aGlzLmxlZnQpIHZlbG9jaXR5LnggLT0gNDAwLjAgKiBkZWx0YTtcbiAgICAgIGlmICh0aGlzLnJpZ2h0KSB2ZWxvY2l0eS54ICs9IDQwMC4wICogZGVsdGE7XG5cbiAgICAgIGlmICggaXNPbk9iamVjdCA9PT0gdHJ1ZSApIHtcbiAgICAgICAgdmVsb2NpdHkueSA9IE1hdGgubWF4KCAwLCB2ZWxvY2l0eS55ICk7XG4gICAgICAgIHRoaXMuY2FuSnVtcCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIG1lLnRyYW5zbGF0ZVgoIHZlbG9jaXR5LnggKiBkZWx0YSApO1xuICAgICAgbWUudHJhbnNsYXRlWSggdmVsb2NpdHkueSAqIGRlbHRhICk7XG4gICAgICBtZS50cmFuc2xhdGVaKCB2ZWxvY2l0eS56ICogZGVsdGEgKTtcblxuICAgICAgaWYgKCBtZS5wb3NpdGlvbi55IDwgMTAgKSB7XG5cbiAgICAgICAgdmVsb2NpdHkueSA9IDA7XG4gICAgICAgIG1lLnBvc2l0aW9uLnkgPSAxMDtcbiAgICAgICAgdGhpcy5jYW5KdW1wID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5wcmV2VGltZSA9IHRpbWU7XG4gICAgfVxuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkUGx1Z2luLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICB2YXIgZGlyZWN0aXZlTmFtZSA9ICd0aHJlZWpzJztcblxuICBfbW9kdWxlLmRpcmVjdGl2ZShkaXJlY3RpdmVOYW1lLCBbKCkgPT4ge1xuICAgIFRIUkVFLkltYWdlVXRpbHMuY3Jvc3NPcmlnaW4gPSAnJztcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICBzY29wZToge1xuICAgICAgICBjb25maWc6ICc9PycgKyBkaXJlY3RpdmVOYW1lXG4gICAgICB9LFxuICAgICAgbGluazogKHNjb3BlLCBlbGVtZW50LCBhdHRycykgPT4ge1xuXG4gICAgICAgIHZhciBzY2VuZTphbnkgPSBudWxsO1xuICAgICAgICB2YXIgY2FtZXJhOmFueSA9IG51bGw7XG4gICAgICAgIHZhciByZW5kZXJlcjphbnkgPSBudWxsO1xuICAgICAgICB2YXIga2VlcFJlbmRlcmluZyA9IHRydWU7XG4gICAgICAgIHZhciByZXNpemVIYW5kbGU6YW55ID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICAgIGtlZXBSZW5kZXJpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgICAgJCh3aW5kb3cpLm9mZigncmVzaXplJywgcmVzaXplRnVuYyk7XG4gICAgICAgICAgZGVsZXRlIHJlbmRlcmVyO1xuICAgICAgICAgIGRlbGV0ZSBjYW1lcmE7XG4gICAgICAgICAgZGVsZXRlIHNjZW5lO1xuICAgICAgICAgIGVsZW1lbnQuZW1wdHkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXNpemVGdW5jID0gKCkgPT4ge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwicmVzaXppbmdcIik7XG4gICAgICAgICAgICBlbGVtZW50LmZpbmQoJ2NhbnZhcycpLndpZHRoKGVsZW1lbnQud2lkdGgoKSkuaGVpZ2h0KGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICAgICAgY2FtZXJhLmFzcGVjdCA9IGVsZW1lbnQud2lkdGgoKSAvIGVsZW1lbnQuaGVpZ2h0KCk7XG4gICAgICAgICAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShlbGVtZW50LndpZHRoKCksIGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudC5vbignJGRlc3Ryb3knLCAoKSA9PiB7XG4gICAgICAgICAgc3RvcCgpO1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcInNjZW5lIGRlc3Ryb3llZFwiKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2NvcGUuJHdhdGNoKCdjb25maWcnLCAoY29uZmlnKSA9PiB7XG4gICAgICAgICAgc3RvcCgpO1xuICAgICAgICAgIGlmICghY29uZmlnIHx8ICFjb25maWcuaW5pdGlhbGl6ZSkge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwibm8gY29uZmlnLCByZXR1cm5pbmdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGVtZXJnZW5jeSB2ZXRcbiAgICAgICAgICAvLyA2MDMtMjI3LTExOTlcbiAgICAgICAgICBsb2cuZGVidWcoXCJjcmVhdGluZyBzY2VuZVwiKTtcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKSwgMC4xLCAyMDAwMCk7XG5cbiAgICAgICAgICBjYW1lcmEuZm9jdXMgPSAoYm94MzphbnksIGFuZ2xlLCBjOmFueSA9IGNhbWVyYSkgPT4ge1xuICAgICAgICAgICAgLy8gYWRqdXN0IHRoZSBjIHBvc2l0aW9uIHRvIGtlZXAgZXZlcnl0aGluZyBpbiB2aWV3LCB3ZSdsbCBkb1xuICAgICAgICAgICAgLy8gZ3JhZHVhbCBhZGp1c3RtZW50cyB0aG91Z2hcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBib3gzLnNpemUoKS55O1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gYm94My5zaXplKCkueCAvIChjYW1lcmEuYXNwZWN0IC8gMik7XG4gICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIndpZHRoOlwiLCB3aWR0aCwgXCIgaGVpZ2h0OlwiLCBoZWlnaHQpO1xuICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCB8fCBoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkaXN0WSA9IE1hdGgucm91bmQoaGVpZ2h0ICogTWF0aC50YW4oIChjYW1lcmEuZm92IC8gMiApICogKCBNYXRoLlBJIC8gMTgwICkpKTtcbiAgICAgICAgICAgIHZhciBkaXN0WCA9IE1hdGgucm91bmQod2lkdGggKiBNYXRoLnRhbiggKGNhbWVyYS5mb3YgLyAyICkgKiAoIE1hdGguUEkgLyAxODAgKSkpO1xuICAgICAgICAgICAgdmFyIGRpc3RaID0gKGRpc3RZICsgZGlzdFgpO1xuICAgICAgICAgICAgLy8gbG9nLmRlYnVnKFwiZGlzdFk6XCIsIGRpc3RZLCBcIiBkaXN0WDpcIiwgZGlzdFgsIFwiZGlzdFo6XCIsIGRpc3RaKTtcbiAgICAgICAgICAgIHZhciB6ID0gTWF0aC5yb3VuZChjLnBvc2l0aW9uLnopO1xuICAgICAgICAgICAgdmFyIHBlcmlvZCA9IDUuMDtcbiAgICAgICAgICAgIGMucG9zaXRpb24ueCA9IGRpc3RYICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICAgICAgYy5wb3NpdGlvbi55ID0gZGlzdFkgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgICAgICBpZiAoeiAhPT0gZGlzdFopIHtcbiAgICAgICAgICAgICAgaWYgKHogPiBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKHogLSBkaXN0WikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgYy5wb3NpdGlvbi56ID0geiAtIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHogPCBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKGRpc3RaIC0geikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgYy5wb3NpdGlvbi56ID0geiArIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGMubG9va0F0KGJveDMuY2VudGVyKCkpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoIHdlYmdsQXZhaWxhYmxlKCkgKSB7XG4gICAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLkNhbnZhc1JlbmRlcmVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGZmZmZmZik7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShlbGVtZW50LndpZHRoKCksIGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICAgIHZhciBkb21FbGVtZW50ID0gcmVuZGVyZXIuZG9tRWxlbWVudDtcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZChkb21FbGVtZW50KTtcblxuICAgICAgICAgICQod2luZG93KS5vbigncmVzaXplJywgcmVzaXplRnVuYyk7XG4gICAgICAgICAgY29uZmlnLmluaXRpYWxpemUocmVuZGVyZXIsIHNjZW5lLCBjYW1lcmEsIGRvbUVsZW1lbnQpO1xuXG4gICAgICAgICAgdmFyIHJlbmRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICgha2VlcFJlbmRlcmluZykge1xuICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5yZW5kZXIpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnJlbmRlcihyZW5kZXJlciwgc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGtlZXBSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICAgIHJlbmRlcigpO1xuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH1dKTtcblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEhlbHBlcnMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCBjbGFzcyBXb3JsZCBpbXBsZW1lbnRzIFJlbmRlcmFibGUge1xuICAgIHByaXZhdGUgYW1iaWVudCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4ZmZmZmZmICk7XG4gICAgcHJpdmF0ZSBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweDg4ODg4OCApO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgc2NlbmUpIHtcbiAgICAgIHRoaXMuYW1iaWVudC5jb2xvci5zZXRIU0woIDAuMSwgMC4zLCAwLjIgKTtcbiAgICAgIHRoaXMubGlnaHQucG9zaXRpb24uc2V0KCAxLCAxLCAwKTtcbiAgICAgIC8vc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZygweGZmZmZmZiwgNTAwLCAxMDAwMClcbiAgICAgIHNjZW5lLmFkZCh0aGlzLmFtYmllbnQpO1xuICAgICAgc2NlbmUuYWRkKHRoaXMubGlnaHQpO1xuXG4gICAgICAvLyBza3lib3hcbiAgICAgIHZhciBtYXRlcmlhbEFycmF5ID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKylcbiAgICAgICAgbWF0ZXJpYWxBcnJheS5wdXNoKG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7XG4gICAgICAgICAgbWFwOiBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdpbWcvc3BhY2Utc2VhbWxlc3MucG5nJyksXG4gICAgICAgICAgc2lkZTogVEhSRUUuQmFja1NpZGVcbiAgICAgICAgfSkpO1xuICAgICAgdmFyIHNreU1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hGYWNlTWF0ZXJpYWwobWF0ZXJpYWxBcnJheSk7XG4gICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLkJveEdlb21ldHJ5KDEwMDAwLCAxMDAwMCwgMTAwMDApLCBza3lNYXRlcmlhbCkpO1xuXG5cbiAgICAgIC8vIGZsb29yXG4gICAgICB2YXIgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuUGxhbmVHZW9tZXRyeSggMzAwMDAsIDMwMDAwLCAxMDAsIDEwMCApO1xuICAgICAgZ2VvbWV0cnkuYXBwbHlNYXRyaXgoIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVJvdGF0aW9uWCggLSBNYXRoLlBJIC8gMiApICk7XG4gICAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoIHsgY29sb3I6IDB4MjIyMjIyIH0gKTtcbiAgICAgIHZhciBtZXNoID0gbmV3IFRIUkVFLk1lc2goIGdlb21ldHJ5LCBtYXRlcmlhbCApO1xuICAgICAgc2NlbmUuYWRkKCBtZXNoICk7XG5cbiAgICAgIC8qXG4gICAgICAvLyBwYXJ0aWNsZSBjbG91ZFxuICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwMDAwOyBpKyspIHtcbiAgICAgICAgdmFyIHZlcnRleCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgICAgIHZlcnRleC54ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIHZlcnRleC55ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIHZlcnRleC56ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGV4KTtcbiAgICAgIH1cbiAgICAgIHZhciBwYXJ0aWNsZXMgPSBuZXcgVEhSRUUuUG9pbnRDbG91ZCggZ2VvbWV0cnksIG5ldyBUSFJFRS5Qb2ludENsb3VkTWF0ZXJpYWwoe2NvbG9yOiAweDg4ODg4OCwgZm9nOiB0cnVlfSkpO1xuICAgICAgc2NlbmUuYWRkKHBhcnRpY2xlcyk7XG4gICAgICAqL1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcblxuICAgIH1cblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicGxheWVyLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIndvcmxkLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdHMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCB2YXIgVmlld0NvbnRyb2xsZXIgPSBjb250cm9sbGVyKCdWaWV3Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJ0t1YmVybmV0ZXNNb2RlbCcsICdLdWJlcm5ldGVzU3RhdGUnLCAnJGVsZW1lbnQnLCAoJHNjb3BlLCBtb2RlbDpLdWJlcm5ldGVzLkt1YmVybmV0ZXNNb2RlbFNlcnZpY2UsIHN0YXRlLCAkZWxlbWVudCkgPT4ge1xuXG4gICAgdmFyIGRlYnVnU2NlbmUgPSBmYWxzZTtcblxuICAgIHZhciByZW5kZXJlcjphbnkgPSB1bmRlZmluZWQ7XG4gICAgdmFyIHNjZW5lOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgY2FtZXJhOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgZG9tRWxlbWVudDphbnkgPSB1bmRlZmluZWQ7XG5cbiAgICB2YXIgc2NlbmVHZW9tZXRyeSA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHZhciBzY2VuZUJvdW5kcyA9IG5ldyBUSFJFRS5Cb3VuZGluZ0JveEhlbHBlcihzY2VuZUdlb21ldHJ5LCAweGZmMDAwMCk7XG5cbiAgICB2YXIgaG9zdE9iamVjdHMgPSB7fTtcblxuICAgIHZhciB1cGRhdGluZyA9IGZhbHNlO1xuICAgIHZhciBoYXNNb3VzZSA9IGZhbHNlO1xuXG4gICAgdmFyIHBsYXllcjpQbGF5ZXIgPSBudWxsO1xuICAgIHZhciB3b3JsZDpXb3JsZCA9IG51bGw7XG5cbiAgICAkc2NvcGUub25Mb2NrID0gKGxvY2spID0+IHtcbiAgICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHBsYXllci5lbmFibGVkID0gbG9jaztcbiAgICB9XG5cbiAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgaW5pdGlhbGl6ZTogKHIsIHMsIGMsIGQpID0+IHtcbiAgICAgICAgbG9nLmRlYnVnKFwiaW5pdCBjYWxsZWRcIik7XG4gICAgICAgIHJlbmRlcmVyID0gcjtcbiAgICAgICAgc2NlbmUgPSBzO1xuICAgICAgICBjYW1lcmEgPSBjO1xuICAgICAgICBkb21FbGVtZW50ID0gZDtcblxuICAgICAgICAkc2NvcGUucGxheWVyID0gcGxheWVyID0gbmV3IFBsYXllcihzY2VuZSwgY2FtZXJhLCBkKTtcbiAgICAgICAgd29ybGQgPSBuZXcgV29ybGQoc2NlbmUpO1xuXG4gICAgICAgIHNjZW5lLmFkZChzY2VuZUdlb21ldHJ5KTtcblxuICAgICAgICBpZiAoZGVidWdTY2VuZSkge1xuICAgICAgICAgIC8vIGRlYnVnIHN0dWZmXG4gICAgICAgICAgLy8gcHV0cyBhIGJvdW5kaW5nIGJveCBhcm91bmQgdGhlIHNjZW5lIHdlIHdhbnQgdG8gdmlld1xuICAgICAgICAgIHNjZW5lLmFkZChzY2VuZUJvdW5kcyk7XG5cbiAgICAgICAgfVxuICAgICAgICAvLyBhZGRzIGxpbmVzIGZvciB0aGUgeC95L3ogYXhpc1xuICAgICAgICAvLyBUaGUgWCBheGlzIGlzIHJlZC4gVGhlIFkgYXhpcyBpcyBncmVlbi4gVGhlIFogYXhpcyBpcyBibHVlXG4gICAgICAgIHZhciBheGlzID0gbmV3IFRIUkVFLkF4aXNIZWxwZXIoMTAwMCk7XG4gICAgICAgIHNjZW5lLmFkZChheGlzKTtcblxuICAgICAgICBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnggPSA5MDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi56ID0gOTA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueCA9IDA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueSA9IDA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueiA9IDA7XG4gICAgICAgIGJ1aWxkU2NlbmUoKTtcbiAgICAgIH0sXG4gICAgICByZW5kZXI6IChyZW5kZXJlciwgc2NlbmUsIGNhbWVyYSkgPT4ge1xuICAgICAgICAvLyBOT1RFIC0gdGhpcyBmdW5jdGlvbiBydW5zIGF0IH4gNjBmcHMhXG4gICAgICAgIGlmICh1cGRhdGluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB3b3JsZC5yZW5kZXIoKTtcbiAgICAgICAgdmFyIGFuZ2xlID0gRGF0ZS5ub3coKSAqIDAuMDAwMTtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi54ID0gMTAwMCAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi56ID0gMTAwMCAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgLy8gc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi54ICs9IDAuMDAxO1xuICAgICAgICAvLyBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnkgKz0gMC4wMDE7XG4gICAgICAgIC8vIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueiArPSAwLjAwMTtcbiAgICAgICAgXy5mb3JJbihob3N0T2JqZWN0cywgKGhvc3RPYmplY3QsIGtleSkgPT4ge1xuICAgICAgICAgIGhvc3RPYmplY3QucmVuZGVyKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzY2VuZUJvdW5kcy51cGRhdGUoKTtcbiAgICAgICAgcGxheWVyLmxvb2tBdChzY2VuZUJvdW5kcy5ib3gpO1xuICAgICAgICBwbGF5ZXIucmVuZGVyKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRTY2VuZSgpIHtcbiAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdXBkYXRpbmcgPSB0cnVlO1xuICAgICAgdmFyIG9yaWdpblggPSAwO1xuICAgICAgdmFyIG9yaWdpblkgPSAwO1xuXG4gICAgICB2YXIgaG9zdHNUb1JlbW92ZSA9IFtdO1xuXG4gICAgICBfLmZvckluKGhvc3RPYmplY3RzLCAoaG9zdE9iamVjdCwga2V5KSA9PiB7XG4gICAgICAgIGlmIChfLmFueShtb2RlbC5ob3N0cywgKGhvc3QpID0+IGhvc3QuZWxlbWVudElkID09PSBrZXkpKSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiS2VlcGluZyBob3N0OiBcIiwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBob3N0c1RvUmVtb3ZlLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIF8uZm9yRWFjaChob3N0c1RvUmVtb3ZlLCAoa2V5KSA9PiB7XG4gICAgICAgIHZhciBob3N0T2JqZWN0ID0gaG9zdE9iamVjdHNba2V5XTtcbiAgICAgICAgaWYgKGhvc3RPYmplY3QpIHtcbiAgICAgICAgICBob3N0T2JqZWN0LmRlc3Ryb3koKTtcbiAgICAgICAgICBkZWxldGUgaG9zdE9iamVjdHNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIF8uZm9yRWFjaChtb2RlbC5ob3N0cywgKGhvc3QpID0+IHtcbiAgICAgICAgdmFyIGlkID0gaG9zdC5lbGVtZW50SWQ7XG4gICAgICAgIGxvZy5kZWJ1ZyhcImhvc3Q6IFwiLCBob3N0KTtcbiAgICAgICAgdmFyIGhvc3RPYmplY3QgPSBob3N0T2JqZWN0c1tpZF0gfHwgbmV3IEhvc3RPYmplY3Qoc2NlbmVHZW9tZXRyeSwgaWQsIGhvc3QpO1xuICAgICAgICBpZiAoIShpZCBpbiBob3N0T2JqZWN0cykpIHtcbiAgICAgICAgICBob3N0T2JqZWN0LnNldFBvc2l0aW9uKG9yaWdpblgsIG9yaWdpblksIDApO1xuICAgICAgICAgIG9yaWdpblggPSBvcmlnaW5YICsgNTAwO1xuICAgICAgICAgIG9yaWdpblkgPSBvcmlnaW5ZICsgNTAwO1xuICAgICAgICAgIGhvc3RPYmplY3RzW2lkXSA9IGhvc3RPYmplY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaG9zdE9iamVjdC51cGRhdGUobW9kZWwsIGhvc3QpO1xuICAgICAgICBob3N0T2JqZWN0LmRlYnVnKGRlYnVnU2NlbmUpO1xuICAgICAgfSk7XG5cbiAgICAgIGxvZy5kZWJ1ZyhcIm1vZGVsIHVwZGF0ZWRcIik7XG4gICAgICB1cGRhdGluZyA9IGZhbHNlO1xuICAgIH1cbiAgICAkc2NvcGUuJG9uKCdrdWJlcm5ldGVzTW9kZWxVcGRhdGVkJywgYnVpbGRTY2VuZSk7XG4gIH1dKTtcblxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
angular.module("hawtio-kube3d-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/kube3d/html/view.html","<div class=\"kube3d-viewport\" ng-controller=\"Kube3d.ViewController\">\n  <div class=\"kube3d-control\" threejs=\"config\"></div>\n  <div class=\"kube3d-instructions\" request-lock=\'onLock(lock)\'>\n    <div class=\"kube3d-instructions-wrapper\">\n      <span class=\"kube3d-start-title\">Click to play</span>\n    </div>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-kube3d-templates");
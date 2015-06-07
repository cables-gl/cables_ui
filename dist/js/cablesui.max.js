var examples=
    [
        {
            "title":"triangledance",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"d8607592-b6f4-4f79-806e-f4f195221482","uiAttribs":{"translate":{"x":273,"y":18}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"Repeat","objName":"Ops.Repeat","id":"48955273-54cd-4ca1-9d5d-639a369060d9","uiAttribs":{"translate":{"x":108,"y":129}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"48955273-54cd-4ca1-9d5d-639a369060d9","objOut":"bc75f222-b906-4260-9675-52436dd8f49d"}]},{"name":"num","value":"11"}],"portsOut":[{"name":"trigger","value":null},{"name":"index","value":10}]},{"name":"Triangle","objName":"Ops.Gl.Meshes.Triangle","id":"bd2e0acc-07e9-4728-85a4-ca68ca96b8ae","uiAttribs":{"translate":{"x":235,"y":548}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"bd2e0acc-07e9-4728-85a4-ca68ca96b8ae","objOut":"c12f7438-d682-4aea-b728-dbb15ef5cdc8"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"475a759a-4117-4dea-ac38-7ada7f43f629","uiAttribs":{"translate":{"x":95,"y":339}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"475a759a-4117-4dea-ac38-7ada7f43f629","objOut":"a691cd7d-880f-417e-8c90-17c0db1a85c1"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":"0.4"},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"bc75f222-b906-4260-9675-52436dd8f49d","uiAttribs":{"translate":{"x":99,"y":81}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"bc75f222-b906-4260-9675-52436dd8f49d","objOut":"d8607592-b6f4-4f79-806e-f4f195221482"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":-1},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"c12f7438-d682-4aea-b728-dbb15ef5cdc8","uiAttribs":{"translate":{"x":225,"y":458}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"c12f7438-d682-4aea-b728-dbb15ef5cdc8","objOut":"475a759a-4117-4dea-ac38-7ada7f43f629"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":-1,"links":[{"portIn":"posZ","portOut":"result","objIn":"c12f7438-d682-4aea-b728-dbb15ef5cdc8","objOut":"68016e5e-65fb-42a2-83d2-e2c84c4ca46c"}]},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":0},{"name":"rotZ","value":-135.23981731026748,"links":[{"portIn":"rotZ","portOut":"result","objIn":"c12f7438-d682-4aea-b728-dbb15ef5cdc8","objOut":"a51a7b27-39bd-40a5-9e8a-4c6205400cf2"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"a51a7b27-39bd-40a5-9e8a-4c6205400cf2","uiAttribs":{"translate":{"x":463,"y":213}},"portsIn":[{"name":"number1","value":10,"links":[{"portIn":"number1","portOut":"index","objIn":"a51a7b27-39bd-40a5-9e8a-4c6205400cf2","objOut":"48955273-54cd-4ca1-9d5d-639a369060d9"}]},{"name":"number2","value":-13.523981731026748,"links":[{"portIn":"number2","portOut":"result","objIn":"a51a7b27-39bd-40a5-9e8a-4c6205400cf2","objOut":"5aaa5e4d-1183-4db7-a81b-a07a5fd9761a"}]}],"portsOut":[{"name":"result","value":-135.23981731026748}]},{"name":"SinusAnim","objName":"Ops.Anim.SinusAnim","id":"aa4bff72-ddbd-4180-8bac-c9cdccb01e5d","uiAttribs":{"translate":{"x":458,"y":69}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"aa4bff72-ddbd-4180-8bac-c9cdccb01e5d","objOut":"d8607592-b6f4-4f79-806e-f4f195221482"}]}],"portsOut":[{"name":"result","value":-0.6147264423193977}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"5aaa5e4d-1183-4db7-a81b-a07a5fd9761a","uiAttribs":{"translate":{"x":461,"y":125}},"portsIn":[{"name":"number1","value":"22"},{"name":"number2","value":-0.6147264423193977,"links":[{"portIn":"number2","portOut":"result","objIn":"5aaa5e4d-1183-4db7-a81b-a07a5fd9761a","objOut":"aa4bff72-ddbd-4180-8bac-c9cdccb01e5d"}]}],"portsOut":[{"name":"result","value":-13.523981731026748}]},{"name":"BasicMaterial","objName":"Ops.Gl.Shader.BasicMaterial","id":"a691cd7d-880f-417e-8c90-17c0db1a85c1","uiAttribs":{"translate":{"x":106,"y":259}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"a691cd7d-880f-417e-8c90-17c0db1a85c1","objOut":"48955273-54cd-4ca1-9d5d-639a369060d9"}]},{"name":"r","value":1,"links":[{"portIn":"r","portOut":"result","objIn":"a691cd7d-880f-417e-8c90-17c0db1a85c1","objOut":"e7204c55-07eb-4cbb-8f1e-b0ba5e903333"}]},{"name":"g","value":0.38978386297822},{"name":"b","value":0.7915484751574695},{"name":"a","value":"0.6"}],"portsOut":[{"name":"trigger","value":null}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"e7204c55-07eb-4cbb-8f1e-b0ba5e903333","uiAttribs":{"translate":{"x":177,"y":198}},"portsIn":[{"name":"number1","value":10,"links":[{"portIn":"number1","portOut":"index","objIn":"e7204c55-07eb-4cbb-8f1e-b0ba5e903333","objOut":"48955273-54cd-4ca1-9d5d-639a369060d9"}]},{"name":"number2","value":"0.1"}],"portsOut":[{"name":"result","value":1}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"68016e5e-65fb-42a2-83d2-e2c84c4ca46c","uiAttribs":{"translate":{"x":245,"y":369}},"portsIn":[{"name":"number1","value":10,"links":[{"portIn":"number1","portOut":"index","objIn":"68016e5e-65fb-42a2-83d2-e2c84c4ca46c","objOut":"48955273-54cd-4ca1-9d5d-639a369060d9"}]},{"name":"number2","value":"-0.1"}],"portsOut":[{"name":"result","value":-1}]}]}
        },
        {
            "title":"if...then",
            "src":{"ops":[{"name":"if true then","objName":"Ops.IfTrueThen","id":"266b503d-3e68-4d49-b30d-9770e711ec88","uiAttribs":{"translate":{"x":249,"y":307}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"266b503d-3e68-4d49-b30d-9770e711ec88","objOut":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb"}]},{"name":"boolean","value":false,"links":[{"portIn":"boolean","portOut":"result","objIn":"266b503d-3e68-4d49-b30d-9770e711ec88","objOut":"e586181b-445c-410e-ae7a-351f487cc523"}]}],"portsOut":[{"name":"then","value":null},{"name":"else","value":null}]},{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"3a29f1af-b1ec-4234-a2d9-93983ba6ed54","uiAttribs":{"translate":{"x":236,"y":57}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"Greater","objName":"Ops.Math.Compare.Greater","id":"e586181b-445c-410e-ae7a-351f487cc523","uiAttribs":{"translate":{"x":369,"y":216}},"portsIn":[{"name":"number1","value":-0.986112747258538,"links":[{"portIn":"number1","portOut":"result","objIn":"e586181b-445c-410e-ae7a-351f487cc523","objOut":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2"}]},{"name":"number2","value":"0"}],"portsOut":[{"name":"result","value":false}]},{"name":"Triangle","objName":"Ops.Gl.Meshes.Triangle","id":"58d9665e-5fbd-4c39-826d-355b7969cb01","uiAttribs":{"translate":{"x":118,"y":446}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"then","objIn":"58d9665e-5fbd-4c39-826d-355b7969cb01","objOut":"266b503d-3e68-4d49-b30d-9770e711ec88"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"rectangle","objName":"Ops.Gl.Meshes.Rectangle","id":"fe1f5d12-e817-44ba-b961-b6e966c07648","uiAttribs":{"translate":{"x":263,"y":444}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"else","objIn":"fe1f5d12-e817-44ba-b961-b6e966c07648","objOut":"266b503d-3e68-4d49-b30d-9770e711ec88"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"SinusAnim","objName":"Ops.Anim.SinusAnim","id":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2","uiAttribs":{"translate":{"x":360,"y":131}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2","objOut":"3a29f1af-b1ec-4234-a2d9-93983ba6ed54"}]}],"portsOut":[{"name":"result","value":-0.986112747258538}]},{"name":"ClearColor","objName":"Ops.Gl.ClearColor","id":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb","uiAttribs":{"translate":{"x":167,"y":186}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb","objOut":"3a29f1af-b1ec-4234-a2d9-93983ba6ed54"}]},{"name":"r","value":null},{"name":"g","value":null},{"name":"b","value":-0.986112747258538,"links":[{"portIn":"b","portOut":"result","objIn":"1dbf78f5-91dd-4528-9e2f-a51f2f8cc9fb","objOut":"d6c0bf3f-1855-4cbc-83cb-48b592a8ace2"}]}],"portsOut":[{"name":"trigger","value":null}]}]}
        },
        {
            "title":"plotter",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"140e6c67-c2fe-4cfc-bd60-29f9059a77ae","uiAttribs":{"translate":{"x":128,"y":72}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"7a616490-a053-4b67-a436-83b477d75a0d","uiAttribs":{"translate":{"x":128,"y":298}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"7a616490-a053-4b67-a436-83b477d75a0d","objOut":"140e6c67-c2fe-4cfc-bd60-29f9059a77ae"}]},{"name":"posX","value":"-1.0"},{"name":"posY","value":0},{"name":"posZ","value":0},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":"33"},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"Sinus","objName":"Ops.Math.Sin","id":"c1facdcb-cc17-453f-a34a-f9fd09700a4d","uiAttribs":{"translate":{"x":351,"y":354}},"portsIn":[{"name":"number","value":543.4359998703003,"links":[{"portIn":"number","portOut":"result","objIn":"c1facdcb-cc17-453f-a34a-f9fd09700a4d","objOut":"74e9fdb1-5aa3-4386-905f-b3a247140b33"}]}],"portsOut":[{"name":"result","value":0.05949404776965134}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"cc7b9ebd-f1aa-4009-a7c9-a03c1141d7a6","uiAttribs":{"translate":{"x":350,"y":228}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"cc7b9ebd-f1aa-4009-a7c9-a03c1141d7a6","objOut":"140e6c67-c2fe-4cfc-bd60-29f9059a77ae"}]}],"portsOut":[{"name":"result","value":135.85899996757507}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"74e9fdb1-5aa3-4386-905f-b3a247140b33","uiAttribs":{"translate":{"x":350,"y":289}},"portsIn":[{"name":"number1","value":135.85899996757507,"links":[{"portIn":"number1","portOut":"result","objIn":"74e9fdb1-5aa3-4386-905f-b3a247140b33","objOut":"cc7b9ebd-f1aa-4009-a7c9-a03c1141d7a6"}]},{"name":"number2","value":"4"}],"portsOut":[{"name":"result","value":543.4359998703003}]},{"name":"Plotter","objName":"Ops.Gl.Meshes.Plotter","id":"4f31f2e8-1117-412f-9e5d-a0fea3ad24ee","uiAttribs":{"translate":{"x":128,"y":537}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"4f31f2e8-1117-412f-9e5d-a0fea3ad24ee","objOut":"7a616490-a053-4b67-a436-83b477d75a0d"}]},{"name":"value","value":0.05949404776965134,"links":[{"portIn":"value","portOut":"result","objIn":"4f31f2e8-1117-412f-9e5d-a0fea3ad24ee","objOut":"c1facdcb-cc17-453f-a34a-f9fd09700a4d"}]}],"portsOut":[{"name":"trigger","value":null}]}]}
        },
        {
            "title":"plotter noise",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f","uiAttribs":{"translate":{"x":128,"y":72}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"a29d9ec1-9eea-4154-83e9-650ccfac45c4","uiAttribs":{"translate":{"x":128,"y":298}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"a29d9ec1-9eea-4154-83e9-650ccfac45c4","objOut":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f"}]},{"name":"posX","value":"-1.0"},{"name":"posY","value":0},{"name":"posZ","value":0},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":"33"},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"Sinus","objName":"Ops.Math.Sin","id":"139a17c8-6f6a-4154-bf64-e81671b7d507","uiAttribs":{"translate":{"x":351,"y":354}},"portsIn":[{"name":"number","value":1250.5350005626678,"links":[{"portIn":"number","portOut":"result","objIn":"139a17c8-6f6a-4154-bf64-e81671b7d507","objOut":"b1e8ade3-7b4b-4354-aa25-0f3412e6021e"}]}],"portsOut":[{"name":"result","value":0.1801357272446712}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"4eef7e36-db76-4ebb-af07-fa242c4c5457","uiAttribs":{"translate":{"x":350,"y":228}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"4eef7e36-db76-4ebb-af07-fa242c4c5457","objOut":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f"}]}],"portsOut":[{"name":"result","value":250.10700011253357}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"b1e8ade3-7b4b-4354-aa25-0f3412e6021e","uiAttribs":{"translate":{"x":350,"y":289}},"portsIn":[{"name":"number1","value":250.10700011253357,"links":[{"portIn":"number1","portOut":"result","objIn":"b1e8ade3-7b4b-4354-aa25-0f3412e6021e","objOut":"4eef7e36-db76-4ebb-af07-fa242c4c5457"}]},{"name":"number2","value":"5"}],"portsOut":[{"name":"result","value":1250.5350005626678}]},{"name":"Plotter","objName":"Ops.Gl.Meshes.Plotter","id":"1b444f62-0aa0-427b-8af4-5f7fcaacc175","uiAttribs":{"translate":{"x":128,"y":537}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"1b444f62-0aa0-427b-8af4-5f7fcaacc175","objOut":"a29d9ec1-9eea-4154-83e9-650ccfac45c4"}]},{"name":"value","value":0.2936247485124131,"links":[{"portIn":"value","portOut":"result","objIn":"1b444f62-0aa0-427b-8af4-5f7fcaacc175","objOut":"dd45504a-bb59-4d4c-b6d7-d27d9a271398"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"random","objName":"Ops.Math.Random","id":"791ee797-0f23-4cf1-b06e-1b37e369a81d","uiAttribs":{"translate":{"x":539,"y":262}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"791ee797-0f23-4cf1-b06e-1b37e369a81d","objOut":"8aa77a43-1510-463b-8bf6-8c0e08fffc0f"}]}],"portsOut":[{"name":"result","value":0.5674451063387096}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"9d6f5fea-1b77-4ac3-96a7-85bfaa532a9b","uiAttribs":{"translate":{"x":530,"y":343}},"portsIn":[{"name":"number1","value":"0.2"},{"name":"number2","value":0.5674451063387096,"links":[{"portIn":"number2","portOut":"result","objIn":"9d6f5fea-1b77-4ac3-96a7-85bfaa532a9b","objOut":"791ee797-0f23-4cf1-b06e-1b37e369a81d"}]}],"portsOut":[{"name":"result","value":0.11348902126774192}]},{"name":"sum","objName":"Ops.Math.Sum","id":"dd45504a-bb59-4d4c-b6d7-d27d9a271398","uiAttribs":{"translate":{"x":340,"y":471}},"portsIn":[{"name":"number1","value":0.1801357272446712,"links":[{"portIn":"number1","portOut":"result","objIn":"dd45504a-bb59-4d4c-b6d7-d27d9a271398","objOut":"139a17c8-6f6a-4154-bf64-e81671b7d507"}]},{"name":"number2","value":0.11348902126774192,"links":[{"portIn":"number2","portOut":"result","objIn":"dd45504a-bb59-4d4c-b6d7-d27d9a271398","objOut":"9d6f5fea-1b77-4ac3-96a7-85bfaa532a9b"}]}],"portsOut":[{"name":"result","value":0.2936247485124131}]}]}
        },
        {
            "title":"obj mesh",
            "src":{"ops":[{"name":"WebGL Renderer","objName":"Ops.Gl.Renderer","id":"de493ddd-ea53-4698-87fc-d96c32872dd0","uiAttribs":{"translate":{"x":159,"y":29}},"portsIn":[],"portsOut":[{"name":"trigger","value":null}]},{"name":"OBJ Mesh","objName":"Ops.Gl.Meshes.ObjMesh","id":"4d6985e0-814a-42e2-8347-831ca7793c27","uiAttribs":{"translate":{"x":258,"y":330}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"4d6985e0-814a-42e2-8347-831ca7793c27","objOut":"7a83d96e-b2af-4370-88a4-821b0503cdc3"}]}],"portsOut":[{"name":"trigger","value":null}]},{"name":"transform","objName":"Ops.Gl.Matrix.Transform","id":"7a83d96e-b2af-4370-88a4-821b0503cdc3","uiAttribs":{"translate":{"x":214,"y":217}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"7a83d96e-b2af-4370-88a4-821b0503cdc3","objOut":"3085deda-2ea7-4f35-ab3f-f5bdc35a8213"}]},{"name":"posX","value":0},{"name":"posY","value":0},{"name":"posZ","value":"-223"},{"name":"scaleX","value":1},{"name":"scaleY","value":1},{"name":"scaleZ","value":1},{"name":"rotX","value":0},{"name":"rotY","value":166.2000060081482,"links":[{"portIn":"rotY","portOut":"result","objIn":"7a83d96e-b2af-4370-88a4-821b0503cdc3","objOut":"ca2ff7af-54a9-4891-9ebd-097d23933cc4"}]},{"name":"rotZ","value":0}],"portsOut":[{"name":"trigger","value":null}]},{"name":"RelativeTime","objName":"Ops.Anim.RelativeTime","id":"8ba0bb62-410d-4199-8ead-d8b89a0f2de0","uiAttribs":{"translate":{"x":412,"y":66}},"portsIn":[{"name":"exe","value":null,"links":[{"portIn":"exe","portOut":"trigger","objIn":"8ba0bb62-410d-4199-8ead-d8b89a0f2de0","objOut":"de493ddd-ea53-4698-87fc-d96c32872dd0"}]}],"portsOut":[{"name":"result","value":3.324000120162964}]},{"name":"multiply","objName":"Ops.Math.Multiply","id":"ca2ff7af-54a9-4891-9ebd-097d23933cc4","uiAttribs":{"translate":{"x":369,"y":130}},"portsIn":[{"name":"number1","value":3.324000120162964,"links":[{"portIn":"number1","portOut":"result","objIn":"ca2ff7af-54a9-4891-9ebd-097d23933cc4","objOut":"8ba0bb62-410d-4199-8ead-d8b89a0f2de0"}]},{"name":"number2","value":"50"}],"portsOut":[{"name":"result","value":166.2000060081482}]},{"name":"BasicMaterial","objName":"Ops.Gl.Shader.BasicMaterial","id":"3085deda-2ea7-4f35-ab3f-f5bdc35a8213","uiAttribs":{"translate":{"x":168,"y":119}},"portsIn":[{"name":"render","value":null,"links":[{"portIn":"render","portOut":"trigger","objIn":"3085deda-2ea7-4f35-ab3f-f5bdc35a8213","objOut":"de493ddd-ea53-4698-87fc-d96c32872dd0"}]},{"name":"r","value":0.470756561961025},{"name":"g","value":0.8225311778951436},{"name":"b","value":"1"},{"name":"a","value":"0.3"}],"portsOut":[{"name":"trigger","value":null}]}]}
        }

    ]
;

document.addEventListener("DOMContentLoaded", function(event)
{
    var scene=new Scene();
    ui=new HOLO.Ui();
    ui.show(scene);


    
});

// --------------------------------

var uiConfig=
{
    portSize:10,
    portPadding:2,

    colorLink:'#fff',
    colorLinkHover:'#00f',
    colorLinkInvalid:'#f00',
    colorOpBg:'#fff',
    colorPort:'#6c9fde',
    colorPortHover:'#f00'
};

function getPortColor(type)
{
    if(type==OP_PORT_TYPE_VALUE) return '#ea6638';
    else return '#6c9fde';
}

var r;

var selectedEndPort=null;


function setStatusText(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
}


function Line(startX, startY, thisPaper)
{
    var start={ x:startX,y:startY};

    this.updateEnd=function(x, y)
    {
        end.x = x;
        end.y = y;
        this.redraw();
    };

    var end = { x: startX, y: startY };
    this.getPath = function()
    {
        var startX=start.x;
        var startY=start.y;

        var endX=end.x;
        var endY=end.y;

        
        return "M "+startX+" "+startY+" L" + endX + " " + endY;

    };
    this.thisLine = thisPaper.path(this.getPath());
    this.thisLine.attr({        stroke: uiConfig.colorLink,
        "stroke-width": 1});
    this.redraw = function() { this.thisLine.attr("path", this.getPath()); };
}





function UiLink(port1, port2)
{
    var self=this;
    this.p1=port1;
    this.p2=port2;
    // todo check if port1 is out / port2 is in...


    this.getPath = function()
    {

        if(!port2.attrs)return '';
        if(!port1.attrs)return '';

        var fromX=port1.matrix.e+port1.attrs.x+uiConfig.portSize/2;
        var fromY=port1.matrix.f+port1.attrs.y;
        var toX=port2.matrix.e+port2.attrs.x+uiConfig.portSize/2;
        var toY=port2.matrix.f+port2.attrs.y;

        var cp1X=0;
        var cp1Y=0;

        var cp2X=0;
        var cp2Y=0;

        cp1Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;
        

        cp2Y=Math.min(fromY,toY)+(Math.max(fromY,toY)-Math.min(fromY,toY))/2;


        if(toY > fromY)
        {
            fromY+=uiConfig.portSize;
        }
        if(fromY > toY)
        {
            toY+=uiConfig.portSize;
        }

cp1X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;
cp2X=Math.min(fromX,toX)+(Math.max(fromX,toX)-Math.min(fromX,toX))/4;


var difx=Math.min(fromX,toX)+Math.abs(toX-fromX);

cp1X=fromX-0;
cp2X=toX+0;









        // return "M "+fromX+" "+fromY+" L" + cpX + " " + cpY;

        return "M "+fromX+" "+fromY+" C " + (cp1X) + " " + (cp1Y) +" "+ (cp2X) + " " + (cp2Y) +" "+ toX + " " + toY;
        // return "M "+fromX+" "+fromY+" L" + toX + " " + toY;
    };

    this.thisLine = r.path(this.getPath());
    this.thisLine.attr(
    {
        "stroke": getPortColor(port1.thePort.type),
        "stroke-width": 2
    });

    this.thisLine.hover(function ()
    {
        this.attr({stroke:uiConfig.colorLinkHover});
    }, function ()
    {
        this.attr({stroke:getPortColor(self.p1.thePort.type)});
    });

    this.remove=function()
    {
        this.thisLine.remove();
    };

    this.redraw = function()
    {
        this.thisLine.attr("path", this.getPath());
    };
}

function getPortDescription(thePort)
{
    return thePort.getName()+' ('+thePort.val+')'+' ['+thePort.getTypeString()+']';
}

var links=[];
var line;

    Raphael.el.setGroup = function (group) { this.group = group; };
    Raphael.el.getGroup = function () { return this.group; };

    Raphael.fn.OpRect = function (x, y, w, h, text)
    {
        var background = this.rect(x, y, w, h).attr({
            fill: uiConfig.colorOpBg,
            stroke: "#000",
            "stroke-width": 0
        });

        var label = this.text(x+w/2,y+h/2, text);
        var layer = this.rect(x, y, w, h).attr({
            fill: "#ccc",
            "fill-opacity": 0,
            "stroke-opacity": 0,
            cursor: "move"
        });

        var group = this.set();
        group.push(background, label, layer);


        layer.setGroup(group);
        return layer;
    };


    var OpUi=function(x,y,w,h,txt)
    {
        var that=this;
        this.links=[];
        this.portsIn=[];
        this.portsOut=[];

        this.remove=function()
        {

            this.oprect.getGroup().remove();
            this.oprect.remove();
        };

        var dragger = function()
        {
          this.group = this.getGroup();

          this.previousDx = 0;
          this.previousDy = 0;

        },
        move = function (dx, dy)
        {
            var txGroup = dx-this.previousDx;
            var tyGroup = dy-this.previousDy;

            this.group.translate(txGroup,tyGroup);
            this.previousDx = dx;
            this.previousDy = dy;

            if(!that.op.uiAttribs)that.op.uiAttribs={};
            that.op.uiAttribs.translate={x:that.oprect.matrix.e,y:that.oprect.matrix.f};

                   
                        
            for(var j in that.links)
            {
                that.links[j].redraw();
            }

        },
        up = function ()
        {

        };


        this.oprect=r.OpRect(x,y,w,h, txt).drag(move, dragger, up);

        this.oprect.node.onclick = function ()
        {
            ui.showOpParams(that.op);
        };

        var PortDrag = function ()
        {
            if(!line)
            {
                this.startx=this.matrix.e+this.attrs.x;
                this.starty=this.matrix.f+this.attrs.y;
            }
        },
        PortMove = function(dx, dy)
        {
            if(!line) line = new Line(this.startx+uiConfig.portSize/2,this.starty+uiConfig.portSize/2, r);
                else line.updateEnd(this.startx+dx,this.starty+dy);

            if(selectedEndPort===null) setStatusText('select a port to link...');
            else
            {
                var txt=Link.canLinkText(selectedEndPort.thePort,this.thePort);
                if(txt=='can link') setStatusText(  getPortDescription(selectedEndPort.thePort));
                    else setStatusText( txt );
            }

            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                line.thisLine.attr({ stroke: uiConfig.colorLink });
            }
            else
            {
                line.thisLine.attr({ stroke: uiConfig.colorLinkInvalid });
            }

        },
        PortUp = function ()
        {
            if(selectedEndPort!==null && Link.canLink(selectedEndPort.thePort,this.thePort))
            {
                var link=ui.scene.link(selectedEndPort.op, selectedEndPort.thePort.getName() , this.op, this.thePort.getName());
                var thelink=new UiLink(selectedEndPort,this);
                selectedEndPort.opUi.links.push(thelink);
                that.links.push(thelink);
            }
            else
            {
                console.log('endport nonono');
                        
            }

            if(line && line.thisLine)line.thisLine.remove();
            line=null;
        };

        this.addPort=function(_inout)
        {
            var yp=0;
            var inout=_inout;
            if(inout=='out') yp=20;

            var portIndex=this.portsIn.length;
            if(inout=='out') portIndex=this.portsOut.length;

            var xpos=x+(uiConfig.portSize+uiConfig.portPadding)*portIndex;
            var ypos=y+yp;

            var port = r.rect(xpos,ypos, uiConfig.portSize, uiConfig.portSize).attr({
            // var port = r.circle(x+(uiConfig.portSize+uiConfig.portPadding)*portIndex,y+yp, uiConfig.portSize/2).attr({
                fill: uiConfig.colorPort,
                "stroke-width": 0
            });


            this.oprect.getGroup().push(port);

            port.direction=inout;
            port.op=that.op;
            port.opUi=that;

            port.portIndex=portIndex;
            var thePort;
            if(inout=='out') thePort=that.op.portsOut[portIndex];
            else thePort=that.op.portsIn[portIndex];

            port.thePort=thePort;
            port.attr({fill:getPortColor(thePort.type)});
            

            port.hover(function ()
            {
                selectedEndPort=this;
                port.toFront();
                port.attr(
                {
                    // fill:uiConfig.colorPortHover,
                    x:xpos-uiConfig.portSize*0.25,
                    y:ypos-uiConfig.portSize*0.25,
                    width:uiConfig.portSize*1.5,
                    height:uiConfig.portSize*1.5,
                    stroke:'#fff',
                    'stroke-width':1,

                });
                
                var statusText='Port: ';

                
                setStatusText(getPortDescription(thePort));

            }, function ()
            {
                selectedEndPort=null;
                port.attr(
                    {
                        fill:getPortColor(this.thePort.type),
                        width:uiConfig.portSize,
                        height:uiConfig.portSize,
                        x:xpos,
                        y:ypos,
                        'stroke-width':0,
                    });

                setStatusText('');
            });

            port.drag(PortMove,PortDrag,PortUp);

            if(inout=='out') this.portsOut.push(port);
                else this.portsIn.push(port);
        };

    };


var HOLO=
{
    Ui:function()
    {
        var self=this;
        this.ops=[];
        this.scene=null;







        this.setLayout=function()
        {
            var statusBarHeight=20;
            var menubarHeight=30;
            var optionsWidth=360;
            var rendererWidth=640;
            var rendererHeight=360;

            $('svg').css('height',window.innerHeight-statusBarHeight-menubarHeight);
            $('svg').css('width',window.innerWidth-rendererWidth);
            $('svg').css('top',menubarHeight);
            
            $('#options').css('left',window.innerWidth-rendererWidth+1);
            $('#options').css('top',rendererHeight);
            $('#options').css('width',optionsWidth);
            $('#options').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#meta').css('right',0);
            $('#meta').css('top',rendererHeight);
            $('#meta').css('width',rendererWidth-optionsWidth);
            $('#meta').css('height',window.innerHeight-rendererHeight-statusBarHeight);

            $('#menubar').css('top',0);
            $('#menubar').css('width',window.innerWidth-rendererWidth);
            $('#menubar').css('height',menubarHeight);
        };


        this.getOpList=function()
        {
            var ops=[];

            function getop(val,parentname)
            {
                if (Object.prototype.toString.call(val) === '[object Object]')
                {
                    for (var propertyName in val)
                    {
                        if (val.hasOwnProperty(propertyName))
                        {
                            var html='';
                            var opname='Ops.'+ parentname + propertyName + '';

                            var isOp=false;
                            if(eval('typeof('+opname+')')=="function") isFunction=true;

                            var op=
                            {
                                isOp:isOp,
                                name:opname,
                                lowercasename:opname.toLowerCase()
                            };
                            ops.push(op);

                            found=getop(val[propertyName],parentname+propertyName+'.');
                        }
                    }
                }
            }

            getop(Ops,'');

            return ops;
        };

        this.addOpList=function(val,parentname)
        {
        
            if (Object.prototype.toString.call(val) === '[object Object]')
            {
                for (var propertyName in val)
                {
                    if (val.hasOwnProperty(propertyName))
                    {
                        var html='';
                        var opname='Ops.'+ parentname + propertyName + '';

                        var isFunction=false;
                        if(eval('typeof('+opname+')')=="function") isFunction=true;

                        if(isFunction)html+='<a onclick="ui.scene.addOp(\''+opname+'\',{})">&nbsp;';
                        html+='Ops.'+parentname + propertyName +'';
                        if(isFunction)html+='&nbsp;</a>';
                        html+='<br/>';
                        $('#meta').append(html);
                        
                        
                        found=this.addOpList(val[propertyName],parentname+propertyName+'.');
                    }
                }
            }

        };

        this.setUpRouting=function()
        {
            var router = new Simrou();

            router.addRoute('/').get(function(event, params)
            {

                if(!localStorage.holo || localStorage.holo===''  || localStorage.holo.length<20)
                {
                    scene.clear();
                    ui.showExample(0);
                }

                self.scene.deSerialize(localStorage.holo);
            });

            router.addRoute('/example/:index').get(function(event, params)
            {
                ui.showExample(params.index);
            });

            router.start();
        };

        this.show=function(_scene)
        {
            this.scene=_scene;
            

            $('#meta').append(getHandleBarHtml('timeline_controler'),{});
            $('#meta').append();

            $('#meta').append('Examples:<br/>');
            for(var example in examples)
            {
                var html='';
                html+='<a href="#/example/'+example+'">'+examples[example].title+'</a><br/>';
                $('#meta').append(html);
            }


            $('#meta').append('<br/><br/>Ops:<br/>');
            this.addOpList(Ops,'');
            r= Raphael(0, 0, 640, 480);
            $('svg').bind( "dblclick", function()
            {

                var html = getHandleBarHtml('op_select',{ops: self.getOpList() });
                self.showModal(html);


                $('#opsearch').focus();
                $('#opsearch').on('input',function(e)
                {
                    var searchFor= $('#opsearch').val();

                    if(!searchFor)
                        $('#search_style').html('.searchable:{display:block;}');
                    else
                        $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
                });


                // self.showOptionsScene();
            });

            // var zpd = new RaphaelZPD(r, { zoom: true, pan: true, drag: true });
            this.bindScene(self.scene);

            window.addEventListener( 'resize', this.setLayout, false );

            this.setLayout();
            this.setUpRouting();
        };

        this.showExample=function(which)
        {
            self.scene.clear();
            self.scene.deSerialize(examples[which].src);
        };

        this.bindScene=function(scene)
        {

            scene.onUnLink=function(p1,p2)
            {
                for(var i in self.ops)
                {

                    for(var j in self.ops[i].links)
                    {
                                
                        if(
                            (self.ops[i].links[j].p1.thePort==p1 && self.ops[i].links[j].p2.thePort==p2) ||
                            (self.ops[i].links[j].p1.thePort==p2 && self.ops[i].links[j].p2.thePort==p1))
                            {
                                self.ops[i].links[j].remove();
                            }
                    }
                }
            };

            scene.onLink=function(p1,p2)
            {
                var uiPort1=null;
                var uiPort2=null;
                for(var i in self.ops)
                {
                    for(var j in self.ops[i].portsIn)
                    {
                        if(self.ops[i].portsIn[j].thePort==p1) uiPort1=self.ops[i].portsIn[j];
                        if(self.ops[i].portsIn[j].thePort==p2) uiPort2=self.ops[i].portsIn[j];
                        
                    }
                    for(var jo in self.ops[i].portsOut)
                    {
                        if(self.ops[i].portsOut[jo].thePort==p1) uiPort1=self.ops[i].portsOut[jo];
                        if(self.ops[i].portsOut[jo].thePort==p2) uiPort2=self.ops[i].portsOut[jo];
                    }
                }
        
                var thelink=new UiLink(uiPort1,uiPort2);
                uiPort1.opUi.links.push(thelink);
                uiPort2.opUi.links.push(thelink);
            };

            scene.onDelete=function(op)
            {
                for(var i in self.ops)
                {
                    if(self.ops[i].op==op)
                    {
                        self.ops[i].remove();
                        self.ops.splice( i, 1 );
                    }
                }
            };

            scene.onAdd=function(op)
            {
                var uiOp=new OpUi(0, 0, 100, 30, op.name);
                uiOp.op=op;
                self.ops.push(uiOp);
                
                for(var i in op.portsIn)
                {
                    uiOp.addPort('in');
                }
                for(var i2 in op.portsOut)
                {
                    uiOp.addPort('out');
                }

                if(op.uiAttribs)
                {
                    if(op.uiAttribs.hasOwnProperty('translate'))
                    {
                        uiOp.oprect.getGroup().translate(op.uiAttribs.translate.x,op.uiAttribs.translate.y);
                    }
                }

            };
        };




        this.closeModal=function()
        {
            $('#modalcontent').html('');
            $('#modalcontent').hide();
            $('#modalbg').hide();
        };

        this.showModal=function(content)
        {
            $('#modalcontent').html('<div class="modalclose"><a class="button" onclick="ui.closeModal();">close</a></div>');
            $('#modalcontent').append(content);
            $('#modalcontent').show();
            $('#modalbg').show();
        };


        this.importDialog=function()
        {
            var html='';
            html+='import:<br/><br/>';
            html+='<textarea id="serialized"></textarea>';
            html+='<br/>';
            html+='<br/>';
            html+='<a class="button" onclick="ui.scene.clear();ui.scene.deSerialize($(\'#serialized\').val());ui.closeModal();">import</a>';
            self.showModal(html);
        };

        this.exportDialog=function()
        {
            var html='';
            html+='export:<br/><br/>';
            html+='<textarea id="serialized"></textarea>';
            self.showModal(html);
            $('#serialized').val(self.scene.serialize());

        };


        this.updateOpParams=function(id)
        {
            self.showOpParams(self.scene.getOpById(id));
        };

        function getHandleBarHtml(name,obj)
        {
            var source   = $("#"+name).html();
            var template = Handlebars.compile(source);
            var context = obj;
            return template(context);
        }

        this.showOpParams=function(op)
        {

            var html = getHandleBarHtml('params_op_head',{op: op});

            var sourcePort = $("#params_port").html();
            var templatePort = Handlebars.compile(sourcePort);

            html += getHandleBarHtml('params_ports_head',{title:'in'});

            for(var i in op.portsIn)
            {
                html += templatePort( {port: op.portsIn[i],dirStr:"in",portnum:i,isInput:true } );
            }

            html += getHandleBarHtml('params_ports_head',{title:'out'});

            for(var i2 in op.portsOut)
            {
                html += templatePort( {port: op.portsOut[i2],dirStr:"out",portnum:i2,isInput:false } );
            }


            html += getHandleBarHtml('params_op_foot',{op: op});


            $('#options').html(html);


            for(var ipo in op.portsOut)
            {
                (function (index)
                {
                    $('#portdelete_out_'+index).on('click',function(e)
                    {
                        op.portsOut[index].removeLinks();
                        self.showOpParams(op);
                    });
                })(ipo);
            }

            for(var ipi in op.portsIn)
            {
                (function (index)
                {
                    $('#portdelete_in_'+index).on('click',function(e)
                    {
                        op.portsIn[index].removeLinks();
                        self.showOpParams(op);
                    });
                })(ipi);
            }

            for(var ipii in op.portsIn)
            {
                (function (index)
                {
                    $('#portval_'+index).on('input',function(e)
                    {
                        op.portsIn[index].val=''+$('#portval_'+index).val();
                        // self.showOpParams(op);
                    });
                })(ipii);

            }

            

        };





    }

};


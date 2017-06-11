#include <String.au3>
#include <FileConstants.au3>
#include <MsgBoxConstants.au3>
#include <WinAPIFiles.au3>
#include <File.au3>
Global $Emojis=["📄"]
Local $Array[7]=[@ScriptDir&"\Pre Algebra.json",@ScriptDir&"\Algebra.json",@ScriptDir&"\Calculus.json",@ScriptDir&"\Functions And Graphing.json",@ScriptDir&"\Main.json",@ScriptDir&"\More Pre Calculus.json",@ScriptDir&"\Pre Calculus.json"]
;Local $Array[1]=[@ScriptDir&"\More Pre Calculus.json"]
Global $newBrand="https://imgix.ttcdn.co/i/product/original/0/324085-d4d2c515a01f4c07914691f889e3b66e.png?w=1000&q=100&auto=format%2Ccompress&fm=jpeg"
Global $MorePreCalculus="http://wisestem.com/files/attach/images/112/117/9ba51c049ba683f02e2b8a3995a79f72.png"
Global $Algebra="http://www.calculators.org/graphics/algebra.jpg"
Global $PreAlgebra="https://www.enasco.com/prod/images/products/14/AC095629l.jpg"
Global $Calculus="http://static1.squarespace.com/static/51bf8df9e4b0356bbe29225f/t/55484017e4b06b185ec198f4/1430798360737/?format=1000w"
Global $PreCalculus="https://s3.amazonaws.com/calc_thumbs/production/cwayqe3vwh.png"
Global $FunctionsGraphing="http://www.interactive-maths.com/uploads/1/1/3/4/11345755/110604_orig.jpg"
for $a in $Array
$File=FileOpen($a,512)
_ReplaceStringInFile($a,'"title": " '&$Emojis[0],'"title":"')
;_ReplaceStringInFile($a,'http://messengerdemo.parseapp.com/img/rift.png','http://www.calculators.org/graphics/algebra.jpg')
;_ReplaceStringInFile($a,'http://messengerdemo.parseapp.com/img/touch.png','http://www.calculators.org/graphics/algebra.jpg')

;_ReplaceStringInFile($a,'http://imgur.com/Sfx8iG3','http://i.imgur.com/Sfx8iG3.png')
;_ReplaceStringInFile($a,'http://messengerdemo.parseapp.com/img/rift.png','http://i.imgur.com/Sfx8iG3.png')
;_ReplaceStringInFile($a,'"content_type":"text"','"type":"postback"')
;_ReplaceStringInFile($a,'"content_type": "text"','"type":"postback"')
;_ReplaceStringInFile($a,"http://i.imgur.com/jIp8QVX.jpg?1","https://www.enasco.com/prod/images/products/14/AC095629l.jpg")
#comments-start
$Source=FileRead($File)
$Array2=_StringBetween($Source,'More ' , ' Quick Reply')
;ConsoleWrite(UBound($Array)& @CRLF)
For $b in $Array2
	;$another=_StringBetween($a,'More ' , '/?fref=pb"')
	$FolderName=StringReplace($a,'.json','')
	$FolderName=StringReplace($FolderName,'D:\Ahmed\WebStorm Debug\Data\','')
	;_FileCreate(@ScriptDir&'\QuickReplies\'& $FolderName &'\' & $b &'.json')
	_ReplaceStringInFile(@ScriptDir&'\Quick Reply\'& $FolderName &'\' & $b &'.json',"","http://i.imgur.com/jIp8QVX.jpg?1")
	ConsoleWrite(@ScriptDir&'\QuickReplies\'& $FolderName &'\' & $b &'.json'& @CRLF)
	;ConsoleWrite($b& @CRLF)
Next
#comments-end
Next
;ConsoleWrite(FileRead($File)&@CRLF)
;$LAST="http://imgur.com/FTKpWin"
;$LAST="http://i.imgur.com/jIp8QVX.jpg?1"
;$PREALGEBRA="https://www.enasco.com/prod/images/products/14/AC095629l.jpg"

const columns = 20;
const rows = 10;

$table = $('table');

var createNewLine = function() {
  var $tr = $('<tr/>');
  for( var j = 0; j < rows + 2; j++ ) {
    var $th = $('<th/>');
    if ( j == 0 || j == rows + 1 ) $th.addClass('inactive').addClass('wall');
    $tr.append( $th );
  }
  return $tr;
}

var initialize = function() {
  $table.empty();
  for( var i = 0; i < columns; i++) {
    $table.append( createNewLine() );
  }

  // 最終行(画面外)
  var $tr = $('<tr/>');
  for( var j = 0; j < rows + 2; j++ ) {
    var $th = $('<th/>');
    $th.addClass('inactive').addClass('wall');
    $tr.append( $th );
  }
  $table.append( $tr );
}
initialize();

var gameOverDisplay = function() {
  $('body').append('<div class="overlay"><div class="texts"><p>GAME OVER</p><p>PRESS ENTER TO REPLAY</p></div></div>');
}

console.log(blocks);

var initY = -1;

var Block = function() {
  this.pos = {x:4, y:initY };
  this.type = 0; // 0-1
  this.size = 0;
  this.cls = "";
  this.angle = 0; // 0-4

  this.initialize =  function() {
    this.pos = {x:4, y:initY };
    this.type = 1 + Math.floor( Math.random() * ( blocks.length - 1 ) );
    if( this.type == 1 ) this.size = 4;
    else this.size = 3;
    this.cls = "cls" + this.type;
    this.angle = Math.floor( Math.random() * 4 );
  };

  // -------------------------
  // 各ターンの判定
  // -------------------------

  this.fallJudge = function() {
    // 今回落ちるのどうなの判定
    this.pos.y++; // 仮に落としてみて判定する
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);
        if( blocks[this.type][this.angle][c][r] == 1) {
          var $targetTH = $getTH( gpos.x, gpos.y );
          if( $targetTH.hasClass('inactive') ) {
            console.log("もう落ちません");
            this.pos.y--;
            return false;
          }
        }
      }
    }
    this.pos.y--; // 初めに仮に落としただけなので、最終的には戻す
    console.log("まだおちます");
    return true;
  };

  // この関数はブロック固有ではなく、グローバルで持たせることにした
  // this.eraseJudge = function() {
  //   // 行を見ていって、消すモノを判定
  // };

  this.gameOverJudge = function() {
    if( this.pos.y <= initY ) {
      return true;
    }
    return false;
  };

  // -------------------------
  // 各ターンの処理
  // -------------------------

  this.clear = function() {
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);
        var $targetTH = $getTH( gpos.x, gpos.y );
        if( !$targetTH.hasClass('inactive') ) {
          $targetTH.removeClass();
        }
      }
    }
  }

  this.fill = function() {
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);
        if( blocks[this.type][this.angle][c][r] == 1) {
          $getTH( gpos.x, gpos.y ).addClass(this.cls);
        } 
      }
    }
  }

  this.redraw = function() {
    this.clear();
    this.fill();
  };

  this.fall = function() {
    // 実際落とす(１行進める)処理
    this.clear();
    this.pos.y++;
    this.fill();
  };

  this.fix = function() {
    // これ以上落ちれないときは、その場を埋めていく処理
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);
        if( blocks[this.type][this.angle][c][r] == 1) {
          $getTH( gpos.x, gpos.y ).addClass(this.cls).addClass('inactive');
        } 
      }
    }        
  }

  // この関数はブロック固有ではなく、グローバルで持たせることにした
  // this.erase = function() {
  //   // 消して、間を詰める
  // };

  // -------------------------
  // 待機時間のアクション
  // -------------------------
  
  this.rotate =  function(cw) {
    this.clear();

    var angleMem = this.angle;
    if( cw ) {
      if ( ++this.angle == 4 ) this.angle = 0;
    } else {
      if ( --this.angle == -1 ) this.angle = 3;
    }
    var avoidCounter = 0;
    if( this.avoidWallWhenRotate() ) {
      avoidCounter++;
      if( this.avoidWallWhenRotate() ) {
        avoidCounter++;
      }
    }
    if( this.avoidFloorWhenRotate() ) {
      avoidCounter++;
    }
    if( avoidCounter >=2 ) this.angle = angleMem;
    
    this.fill();
  };

  this.slide = function( left ) {
    var posxMem = this.pos.x;
    this.clear();
    if( left ) {
      this.pos.x--;
    } else {
      this.pos.x++;
    }
    var avoidCounter = 0;
    if(  this.avoidWhenSlide( left ) ) {
      avoidCounter++;
      if(  this.avoidWhenSlide( left ) ) {
        avoidCounter++;
      }
    }
    if( avoidCounter >=2 ) this.pos.x = posxMem;
   
    this.fill();
  };

  // -------------------------
  // 位置修正処理
  // -------------------------

  this.avoidWallWhenRotate = function() {
    // 壁にぶつかっているときにずらす処理
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);

        if( blocks[this.type][this.angle][c][r] == 1 ) {
          // 既存ブロック判定
          if ( $getTH( gpos.x, gpos.y ).hasClass('inactive') ) {
            if( this.type == 1) {
              if( r == 1 ) {
                this.pos.x += 2;
              } else if ( r == 0) {
                if ( $getTH( gpos.x + 1, gpos.y).hasClass('inactive') ) {
                  this.pos.x += 2;
                } else {
                  this.pos.x++;
                }
              } else if ( r == 2 ) {
                this.pos.x -= 2;
              } else if ( r == 3 ) {
                if ( $getTH( gpos.x - 1, gpos.y).hasClass('inactive') ) {
                  this.pos.x -= 2;
                } else {
                  this.pos.x--;
                }
              }
            } else {
              if ( r == 0 ) {
                this.pos.x++;
              } else if ( r == 2 ) {
                this.pos.x--;
              }
            }
            return true;
          }
        }
      }
    }
    return false;
  };

  this.avoidFloorWhenRotate = function() {
    // 最後のあがきでくるくる回したりするときに上によける処理
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);

        if( blocks[this.type][this.angle][c][r] == 1 ) {
          // 既存ブロック判定
          if ( $getTH( gpos.x, gpos.y ).hasClass('inactive') ) {
            if( this.type == 1) {
              if( c == 2 ) {
                this.pos.y -= 2;
              } else if ( r == 3) {
                if ( $getTH( gpos.x, gpos.y + 1).hasClass('inactive') ) {
                  this.pos.y -= 2;
                } else {
                  this.pos.y--;
                }
              } 
            } else {
              if ( c == 2 ) {
                this.pos.y--;
              }
            }
            return true;
          }
        }
      }
    }
    return false;
  };

  this.avoidWhenSlide = function( left ) {
    // スライド時のぶつかり判定
    for ( var c = 0; c < this.size; c++ ) {
      for ( var r = 0; r < this.size; r++ ) {
        var gpos = this.globalPos(r,c);

        if( blocks[this.type][this.angle][c][r] == 1 ) {
          // 既存ブロック判定
          if ( $getTH( gpos.x, gpos.y ).hasClass('inactive') ) {
            if ( left ) {
              this.pos.x++;
            } else {
              this.pos.x--;
            }
            return true;
          }
        }
      }
    }
    return false;
  };

  // -------------------------
  // ユーティリティ
  // -------------------------

  this.globalPos = function( localx, localy ) {
    return { x: this.pos.x + localx, y: this.pos.y + localy };
  };
}

// -------------------------
// グローバルなユーティリティ
// -------------------------

var $getTH = function( x, y ) {
  return $('tr:eq(' + y + ') th:eq(' + x + ')');
};

// -------------------------
// 大事な大事なラインを消して詰める処理
// -------------------------

var eraseJudge = function( block ) {
  console.log( "erase judge" );
  for ( var c = block.pos.y; c < block.pos.y + block.size; c++ ) {
    if( c >= columns ) continue;  // 画面外最終行（床行）の場合は何もしない
    if( $('tr:eq(' + c + ') th.inactive').length == rows + 2 ) {  // すべてが inactive だったらば
       console.log( "***********ERASE**********" );
       eraseOneLineFillOneLine( $('tr:eq(' + c + ')') );
    } else {
      console.log("けさないよ");
    }
  } 
};

var eraseOneLineFillOneLine = function( $tr ) {
  $tr.remove();
  $table.prepend( createNewLine() );
}

// -----------------------------------
// ゲーム進行
// -----------------------------------

$(function() {
  var loopID;
  var block = new Block();
  block.initialize();
  console.log(block);

  var fallProcess = function() {
    if( block.fallJudge() ) { // 落ちられるなら
      block.fall();           // 落ちます
    }  else {
      block.fix();            // 落ちられないなら、ブロックを固定します
      eraseJudge( block );    // 消える行ありますか？消します。詰めます。
      if( block.gameOverJudge() ) { // ブロックが落ちないと言うことは、もしかしてゲームオーバーですか？
        return false;         // fallProcess終了のおしらせ
      }
      block.initialize();     // ブロックを新たに生成（リセット）
    }
    return true;
  }

  var loop = function () {
    if( fallProcess() ) {           // ゲームが続いている間は
      loopID = setTimeout(loop, 1000);  // ループ継続
    } else {
      loopID = null;                // 終わっていたらloop継続をせず
      gameOverDisplay();            // 終了画面を出す
    }
  };
  loopID = setTimeout(loop, 1000);  // 初回のゲーム開始

  // -------------------------
  // 操作
  // -------------------------
  $(window).keydown( function(e) {
    if( loopID !== null ) {
      switch( e.which ) {
      case 114: //r
        block.rotate(true);
        break;
      
      case 82:  //shift+r
        block.rotate(false);
        break;

      case 37:  //left
        block.slide(true);
        break;

      case 39:  //right
        block.slide(false);
        break;

      case 40:  //down
        fallProcess();
        break;

      default:
        console.log(e.which);
        break;
      }       
    } else {
      switch( e.which) {
      case 13:  //Enter
        $('.overlay').remove();           // gameover画面を消して
        console.log("replay!");
        initialize();                     // 環境を元に戻す
        block.initialize();               // 落下ブロックも初期化
        loopID = setTimeout(loop, 1000);  // 再開
        break;
      }
    }

  });
});
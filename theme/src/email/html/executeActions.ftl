<#outputformat "plainText">
<#assign actions = requiredActions![]>
<#if actions?size == 1>
<#assign title = msg("requiredAction.${actions[0]}")>
<#assign button = msg("arcButton.${actions[0]}")>
<#else>
<#assign title = msg("arcExecuteActionsTitle")>
<#assign button = msg("arcContinue")>
</#if>
</#outputformat>
<#import "template.ftl" as layout>
<@layout.emailLayout title=title button=button link=link>
${kcSanitize(msg("arcExecuteActionsLine", linkExpirationFormatter(linkExpiration)))?no_esc}
</@layout.emailLayout>
